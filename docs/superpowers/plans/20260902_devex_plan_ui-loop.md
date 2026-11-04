# UI 루프 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 화면 품질을 사람의 감이 아니라 통과·실패가 갈리는 게이트로 관리하는 전역 스킬 `ui-loop`와 검사기 2종을 만들고, 이 앱에 첫 실전 적용한다.

**Architecture:** 전역 스킬 폴더 `~/.claude/skills/ui-loop/` 하나에 검사기 2개(`check-code.mjs` 코드 검사, `shoot.mjs` 화면 측정)와 기본 임계값을 둔다. 프로젝트는 `ui-loop.config.json` 한 개만 갖는다. 화면 측정은 이미 설치된 gstack `browse` 바이너리를 자식 프로세스로 호출하므로 새 의존성이 없다. 판정 로직은 전부 순수 함수로 분리해 `node --test`로 검증한다.

**Tech Stack:** Node 22 (내장 `node:test`, `node:fs`, `node:child_process`), gstack `browse` CLI, 기존 `verify-design-tokens.mjs`. **새 npm 의존성 0개.**

**Spec:** `docs/superpowers/specs/20260902_devex_design_ui-loop-workflow.md`

## Global Constraints

- 새 npm 의존성을 추가하지 않는다. Node 22 표준 라이브러리와 이미 설치된 바이너리만 쓴다.
- 스킬은 `~/.claude/skills/ui-loop/` 한 곳에만 둔다. 프로젝트로 복사하지 않는다.
- 모든 임계값은 `~/.claude/skills/ui-loop/rules.default.json`에 있고, 프로젝트가 `ui-loop.config.json`의 `rules` 항목으로 덮어쓴다. 코드에 숫자를 박지 않는다.
- 검사기는 종료 코드로 결과를 알린다: `0`=통과, `1`=fail 있음. `warn`만 있으면 `0`.
- 리포트 언어는 한국어. 파일명은 ASCII.
- `browse` 실행 경로는 `~/.local/bin/browse`. 없으면 `~/.claude/skills/gstack/browse/dist/browse`로 대체한다.
- PVT 측정 화면은 움직임 관련 규칙에서 제외한다. 반응시간 오염 방지가 우선이다.
- 이 앱은 의료 진단·정상/비정상 판정·연령 백분위를 만들지 않는다. 문구 규칙은 이 경계를 넘지 않는다.

### 기준선 실측값 (2026-09-02, 고치기 전)

Task 7의 합격 판정에 쓰는 값이다. 검사기는 아래를 **전부** 잡아내야 한다.

| 항목 | 실측 | 임계 | 기대 판정 |
|---|---|---|---|
| 홈 스크롤 비 (390×844) | 1.00 | 1.2 | 통과 |
| 플레이 스크롤 비 (390×844) | **1.39** | 1.2 | **fail** |
| H1 22px ÷ H2 19px | **1.16** | 1.25 | **fail** |
| 이모지 개수 | **48개 / 11개 파일** | 0 | **fail** |
| 버튼 그라데이션 | `src/styles.css:217`, `src/styles.css:331` | 0 | **fail** |
| 탭 라벨과 화면 제목 중복 | 플레이 | 0 | **fail** |
| 게임 설명의 공인 검사명 | 0개 | 게임마다 1개 이상 | **fail** |

---

## File Structure

| 경로 | 책임 |
|---|---|
| `~/.claude/skills/ui-loop/SKILL.md` | 게이트 순서, 기존 스킬 라우팅, AI 판독 체크리스트 |
| `~/.claude/skills/ui-loop/rules.default.json` | 규칙 등급과 임계값 기본값 |
| `~/.claude/skills/ui-loop/lib/config.mjs` | 설정 로드와 기본값 병합 |
| `~/.claude/skills/ui-loop/lib/report.mjs` | 판정 결과 → 마크다운 리포트 문자열 |
| `~/.claude/skills/ui-loop/lib/code-rules.mjs` | 규칙 1~7 순수 함수 (문자열 입력 → 판정 배열) |
| `~/.claude/skills/ui-loop/lib/contrast.mjs` | 규칙 12 (대비 검증기 결과 변환) |
| `~/.claude/skills/ui-loop/lib/screen-rules.mjs` | 규칙 8~11 순수 함수 (측정값 입력 → 판정 배열) |
| `~/.claude/skills/ui-loop/check-code.mjs` | 파일을 읽어 `code-rules`에 넘기는 실행부 |
| `~/.claude/skills/ui-loop/shoot.mjs` | `browse`를 띄워 촬영·측정하고 `screen-rules`에 넘기는 실행부 |
| `~/.claude/skills/ui-loop/test/*.test.mjs` | `node --test`로 도는 판정 함수 테스트 |
| 프로젝트 `ui-loop.config.json` | 화면 목록, URL, 뷰포트, 프로젝트별 임계값 |
| 프로젝트 `docs/design/screens.md` | 화면 계약서 (G1 산출물) |

판정 함수(`*-rules.mjs`)와 실행부(`check-code.mjs`, `shoot.mjs`)를 나누는 이유는, 파일 시스템과 브라우저 없이 판정 로직만 테스트하기 위해서다.

---

## 공통 자료구조

모든 규칙 함수는 아래 모양의 배열을 돌려준다. 이 모양은 전 태스크에서 동일하다.

```js
/**
 * @typedef {Object} Finding
 * @property {string} rule    - 규칙 ID. 예: 'EMOJI_ICON'
 * @property {'fail'|'warn'|'pass'} level
 * @property {string} where   - 위치. 예: 'src/domain/session.ts:96'
 * @property {string} message - 한국어 한 줄 설명
 * @property {number|null} actual - 측정값. 없으면 null
 * @property {number|null} limit  - 임계값. 없으면 null
 */
```

---

### Task 1: 스킬 뼈대 — 설정 로드와 리포트 출력

**Files:**
- Create: `~/.claude/skills/ui-loop/rules.default.json`
- Create: `~/.claude/skills/ui-loop/lib/config.mjs`
- Create: `~/.claude/skills/ui-loop/lib/report.mjs`
- Test: `~/.claude/skills/ui-loop/test/config.test.mjs`
- Test: `~/.claude/skills/ui-loop/test/report.test.mjs`

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces:
  - `loadConfig(projectDir: string) => Config` — `ui-loop.config.json`을 읽어 `rules.default.json`과 병합한 객체를 돌려준다. 설정 파일이 없으면 `Error('ui-loop.config.json 없음: ' + projectDir)`를 던진다.
  - `renderReport(findings: Finding[], meta: {title: string, when: string}) => string` — 마크다운 문자열.
  - `worstLevel(findings: Finding[]) => 'fail'|'warn'|'pass'`

- [ ] **Step 1: 폴더를 만들고 기본 규칙 파일을 쓴다**

`mkdir -p ~/.claude/skills/ui-loop/lib ~/.claude/skills/ui-loop/test` 후,
`~/.claude/skills/ui-loop/rules.default.json`에 아래를 쓴다.

```json
{
  "EMOJI_ICON":    { "level": "fail", "limit": 0 },
  "GRADIENT":      { "level": "fail", "limit": 0 },
  "RAW_COLOR":     { "level": "fail", "limit": 0 },
  "DUP_TITLE":     { "level": "fail", "limit": 0 },
  "BOX_DEPTH":     { "level": "fail", "limit": 2 },
  "LONG_LIST":     { "level": "warn", "limit": 6 },
  "TRUST_SOURCE":  { "level": "fail", "limit": 1 },
  "SCROLL_BUDGET": { "level": "fail", "limit": 1.2 },
  "TYPE_SCALE":    { "level": "fail", "limit": 1.25 },
  "HUE_MONOTONE":  { "level": "warn", "limit": 2, "max": 4 },
  "TAP_TARGET":    { "level": "warn", "limit": 44 },
  "CONTRAST":      { "level": "fail", "limit": 4.5 }
}
```

- [ ] **Step 2: 실패하는 테스트를 쓴다**

`~/.claude/skills/ui-loop/test/config.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfig } from '../lib/config.mjs';

test('설정이 없으면 경로를 담은 오류를 던진다', () => {
  const dir = mkdtempSync(join(tmpdir(), 'uiloop-'));
  assert.throws(() => loadConfig(dir), /ui-loop.config.json/);
});

test('프로젝트 설정이 기본 임계값을 덮어쓴다', () => {
  const dir = mkdtempSync(join(tmpdir(), 'uiloop-'));
  writeFileSync(join(dir, 'ui-loop.config.json'), JSON.stringify({
    src: 'src',
    rules: { SCROLL_BUDGET: { limit: 1.5 } },
  }));
  const cfg = loadConfig(dir);
  assert.equal(cfg.rules.SCROLL_BUDGET.limit, 1.5);
  assert.equal(cfg.rules.SCROLL_BUDGET.level, 'fail', '덮어쓰지 않은 칸은 기본값이 남아야 한다');
  assert.equal(cfg.rules.TYPE_SCALE.limit, 1.25, '언급되지 않은 규칙은 기본값 그대로여야 한다');
});
```

`~/.claude/skills/ui-loop/test/report.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderReport, worstLevel } from '../lib/report.mjs';

test('fail이 하나라도 있으면 worstLevel은 fail이다', () => {
  assert.equal(worstLevel([{ level: 'pass' }, { level: 'warn' }, { level: 'fail' }]), 'fail');
  assert.equal(worstLevel([{ level: 'pass' }, { level: 'warn' }]), 'warn');
  assert.equal(worstLevel([]), 'pass');
});

test('리포트에 규칙 ID와 측정값이 들어간다', () => {
  const md = renderReport(
    [{ rule: 'TYPE_SCALE', level: 'fail', where: '홈', message: '제목 위계가 부족합니다', actual: 1.16, limit: 1.25 }],
    { title: '화면 검사', when: '2026-09-02' },
  );
  assert.match(md, /TYPE_SCALE/);
  assert.match(md, /1\.16/);
  assert.match(md, /1\.25/);
  assert.match(md, /화면 검사/);
});
```

- [ ] **Step 3: 테스트가 실패하는지 확인한다**

Run: `cd ~/.claude/skills/ui-loop && node --test test/`
Expected: FAIL — `Cannot find module '../lib/config.mjs'`

- [ ] **Step 4: 최소 구현을 쓴다**

`~/.claude/skills/ui-loop/lib/config.mjs`:

```js
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL_DIR = dirname(dirname(fileURLToPath(import.meta.url)));

export function loadConfig(projectDir) {
  const path = join(projectDir, 'ui-loop.config.json');
  if (!existsSync(path)) throw new Error('ui-loop.config.json 없음: ' + projectDir);

  const defaults = JSON.parse(readFileSync(join(SKILL_DIR, 'rules.default.json'), 'utf8'));
  const project = JSON.parse(readFileSync(path, 'utf8'));

  const rules = {};
  for (const [id, base] of Object.entries(defaults)) {
    rules[id] = { ...base, ...(project.rules?.[id] ?? {}) };
  }

  return {
    projectDir,
    src: project.src ?? 'src',
    tokensFile: project.tokensFile ?? null,
    tokenPrefix: project.tokenPrefix ?? null,
    tokenRoles: project.tokenRoles ?? null,
    baseUrl: project.baseUrl ?? null,
    viewports: project.viewports ?? [{ name: 'mobile', size: '390x844' }],
    screens: project.screens ?? [],
    tabLabels: project.tabLabels ?? [],
    trustTerms: project.trustTerms ?? [],
    rules,
  };
}
```

`~/.claude/skills/ui-loop/lib/report.mjs`:

```js
const ORDER = { pass: 0, warn: 1, fail: 2 };
const MARK = { pass: '통과', warn: '주의', fail: '실패' };

export function worstLevel(findings) {
  return findings.reduce((worst, f) => (ORDER[f.level] > ORDER[worst] ? f.level : worst), 'pass');
}

export function renderReport(findings, meta) {
  const counts = { fail: 0, warn: 0, pass: 0 };
  for (const f of findings) counts[f.level] += 1;

  const lines = [
    '# ' + meta.title,
    '',
    '측정 시각: ' + meta.when,
    '',
    '**실패 ' + counts.fail + '건 / 주의 ' + counts.warn + '건 / 통과 ' + counts.pass + '건**',
    '',
    '| 판정 | 규칙 | 위치 | 측정 | 임계 | 설명 |',
    '|---|---|---|---|---|---|',
  ];

  for (const f of findings) {
    const actual = f.actual === null || f.actual === undefined ? '-' : String(f.actual);
    const limit = f.limit === null || f.limit === undefined ? '-' : String(f.limit);
    lines.push('| ' + MARK[f.level] + ' | `' + f.rule + '` | ' + f.where + ' | ' + actual + ' | ' + limit + ' | ' + f.message + ' |');
  }

  lines.push('', '> 이 수치는 실제 실행에서 나왔습니다. 다른 실행의 수치를 여기에 옮겨 적지 마십시오.');
  return lines.join('\n');
}
```

- [ ] **Step 5: 테스트가 통과하는지 확인한다**

Run: `cd ~/.claude/skills/ui-loop && node --test test/`
Expected: PASS — 4 tests

- [ ] **Step 6: 산출물을 확인한다**

스킬은 홈 디렉터리에 있고 git 저장소가 아니다. 이 프로젝트 저장소에는 커밋하지 않는다.

Run: `ls -la ~/.claude/skills/ui-loop/lib ~/.claude/skills/ui-loop/rules.default.json`
Expected: `config.mjs`, `report.mjs`, `rules.default.json`이 보인다.

---

### Task 2: 코드 규칙 7개

**Files:**
- Create: `~/.claude/skills/ui-loop/lib/code-rules.mjs`
- Create: `~/.claude/skills/ui-loop/check-code.mjs`
- Test: `~/.claude/skills/ui-loop/test/code-rules.test.mjs`

**Interfaces:**
- Consumes: `loadConfig`, `renderReport`, `worstLevel` (Task 1)
- Produces:
  - `checkEmoji(files, rule) => Finding[]`
  - `checkGradient(files, rule) => Finding[]`
  - `checkRawColor(files, rule, tokensFile) => Finding[]`
  - `checkDupTitle(files, rule, tabLabels) => Finding[]`
  - `checkBoxDepth(files, rule) => Finding[]`
  - `checkLongList(files, rule) => Finding[]`
  - `checkTrustSource(files, rule, trustTerms) => Finding[]`
  - `runCodeRules(files, config) => Finding[]` — 위 7개를 순서대로 실행해 이어붙인다.
  - `files`의 원소는 `{ path: string, text: string }`이다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`~/.claude/skills/ui-loop/test/code-rules.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkEmoji, checkGradient, checkRawColor, checkDupTitle,
  checkBoxDepth, checkLongList, checkTrustSource,
} from '../lib/code-rules.mjs';

const FAIL0 = { level: 'fail', limit: 0 };

test('EMOJI_ICON — 소스의 이모지를 줄 번호와 함께 잡는다', () => {
  const files = [{ path: 'src/a.ts', text: "home: { icon: '\u{1F3E0}' },\nplay: { icon: '\u{1F3AE}' },\n" }];
  const found = checkEmoji(files, FAIL0);
  assert.equal(found.length, 2);
  assert.equal(found[0].rule, 'EMOJI_ICON');
  assert.equal(found[0].level, 'fail');
  assert.equal(found[0].where, 'src/a.ts:1');
});

test('EMOJI_ICON — 이모지가 없으면 통과 한 건을 돌려준다', () => {
  const found = checkEmoji([{ path: 'src/a.ts', text: 'const x = 1;\n' }], FAIL0);
  assert.equal(found.length, 1);
  assert.equal(found[0].level, 'pass');
});

test('GRADIENT — linear-gradient는 잡고 radial-gradient는 넘어간다', () => {
  const files = [{ path: 'src/s.css', text: 'a{background:linear-gradient(135deg,var(--a),var(--b));}\nb{background:radial-gradient(circle,red,blue);}\n' }];
  const found = checkGradient(files, FAIL0).filter((f) => f.level === 'fail');
  assert.equal(found.length, 1, 'radial-gradient는 배경 분위기용이라 허용한다');
  assert.equal(found[0].where, 'src/s.css:1');
});

test('RAW_COLOR — 토큰 파일은 건너뛰고 다른 파일의 색 리터럴만 잡는다', () => {
  const files = [
    { path: 'src/tokens.css', text: ':root{--g-ink:#F5F7FF;}\n' },
    { path: 'src/other.css', text: 'a{color:#ff0000;}\n' },
  ];
  const found = checkRawColor(files, FAIL0, 'src/tokens.css').filter((f) => f.level === 'fail');
  assert.equal(found.length, 1);
  assert.equal(found[0].where, 'src/other.css:1');
});

test('DUP_TITLE — 탭 라벨과 같은 화면 제목을 잡는다', () => {
  const files = [{ path: 'src/PlayTab.tsx', text: '<h1 className="page-title">플레이</h1>\n' }];
  const found = checkDupTitle(files, FAIL0, ['홈', '플레이']).filter((f) => f.level === 'fail');
  assert.equal(found.length, 1);
  assert.match(found[0].message, /플레이/);
});

test('DUP_TITLE — 탭에 없는 제목은 통과다', () => {
  const files = [{ path: 'src/A.tsx', text: '<h1>오늘의 결과</h1>\n' }];
  const found = checkDupTitle(files, FAIL0, ['홈', '플레이']).filter((f) => f.level === 'fail');
  assert.equal(found.length, 0);
});

test('BOX_DEPTH — card 클래스가 3단 중첩되면 잡는다', () => {
  const text = '<div className="card"><div className="card"><div className="card">x</div></div></div>\n';
  const found = checkBoxDepth([{ path: 'src/A.tsx', text }], { level: 'fail', limit: 2 })
    .filter((f) => f.level === 'fail');
  assert.equal(found.length, 1);
  assert.equal(found[0].actual, 3);
});

test('BOX_DEPTH — 2단은 통과다', () => {
  const text = '<div className="card"><div className="card">x</div></div>\n';
  const found = checkBoxDepth([{ path: 'src/A.tsx', text }], { level: 'fail', limit: 2 })
    .filter((f) => f.level === 'fail');
  assert.equal(found.length, 0);
});

test('LONG_LIST — 같은 클래스가 6개를 넘으면 주의를 낸다', () => {
  const text = Array.from({ length: 7 }, (_, i) => '<li className="game-item">게임' + i + '</li>').join('\n');
  const found = checkLongList([{ path: 'src/A.tsx', text }], { level: 'warn', limit: 6 })
    .filter((f) => f.level === 'warn');
  assert.equal(found.length, 1);
  assert.equal(found[0].actual, 7);
});

test('TRUST_SOURCE — 공인 검사명이 하나도 없으면 잡는다', () => {
  const files = [{ path: 'src/GuideTab.tsx', text: '숫자가 뜨면 바로 누르세요.\n' }];
  const found = checkTrustSource(files, { level: 'fail', limit: 1 }, ['PVT', 'Stroop'])
    .filter((f) => f.level === 'fail');
  assert.equal(found.length, 1);
});

test('TRUST_SOURCE — 검사명이 있으면 통과다', () => {
  const files = [{ path: 'src/GuideTab.tsx', text: '이 과제는 PVT를 줄인 것입니다.\n' }];
  const found = checkTrustSource(files, { level: 'fail', limit: 1 }, ['PVT', 'Stroop'])
    .filter((f) => f.level === 'fail');
  assert.equal(found.length, 0);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `cd ~/.claude/skills/ui-loop && node --test test/code-rules.test.mjs`
Expected: FAIL — `Cannot find module '../lib/code-rules.mjs'`

- [ ] **Step 3: 규칙 함수를 구현한다**

`~/.claude/skills/ui-loop/lib/code-rules.mjs`:

```js
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
const BOX_CLASS = /\b(card|panel|box|tile|surface)\b/;

function pass(rule, message) {
  return [{ rule, level: 'pass', where: '-', message, actual: null, limit: null }];
}

function eachLine(files, fn) {
  const out = [];
  for (const file of files) {
    const lines = file.text.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const hit = fn(lines[i], file, i + 1);
      if (hit) out.push(hit);
    }
  }
  return out;
}

export function checkEmoji(files, rule) {
  const found = eachLine(files, (line, file, n) =>
    EMOJI.test(line)
      ? {
          rule: 'EMOJI_ICON', level: rule.level, where: file.path + ':' + n,
          message: '이모지를 UI 요소로 쓰고 있습니다. OS마다 모양이 달라 통제되지 않습니다. SVG 아이콘으로 바꾸세요.',
          actual: 1, limit: rule.limit,
        }
      : null);
  return found.length ? found : pass('EMOJI_ICON', '이모지 사용 없음');
}

export function checkGradient(files, rule) {
  const found = eachLine(files, (line, file, n) =>
    line.includes('linear-gradient')
      ? {
          rule: 'GRADIENT', level: rule.level, where: file.path + ':' + n,
          message: 'linear-gradient는 버튼·표면을 촌스럽게 만듭니다. 단색 토큰을 쓰세요. 분위기용 radial-gradient는 허용합니다.',
          actual: 1, limit: rule.limit,
        }
      : null);
  return found.length ? found : pass('GRADIENT', 'linear-gradient 없음');
}

export function checkRawColor(files, rule, tokensFile) {
  const literal = /#[0-9a-fA-F]{3,8}\b|\brgba?\(/;
  const targets = files.filter((f) => f.path !== tokensFile);
  const found = eachLine(targets, (line, file, n) =>
    literal.test(line)
      ? {
          rule: 'RAW_COLOR', level: rule.level, where: file.path + ':' + n,
          message: '색을 직접 적었습니다. ' + (tokensFile ?? '토큰 파일') + '의 토큰을 쓰세요.',
          actual: 1, limit: rule.limit,
        }
      : null);
  return found.length ? found : pass('RAW_COLOR', '토큰 밖 색 리터럴 없음');
}

export function checkDupTitle(files, rule, tabLabels) {
  if (!tabLabels.length) return pass('DUP_TITLE', '탭 라벨이 설정되지 않아 검사를 건너뜁니다');
  const heading = /<h1[^>]*>([^<]+)<\/h1>/;
  const found = eachLine(files, (line, file, n) => {
    const m = line.match(heading);
    if (!m) return null;
    const title = m[1].trim();
    if (!tabLabels.includes(title)) return null;
    return {
      rule: 'DUP_TITLE', level: rule.level, where: file.path + ':' + n,
      message: '화면 제목 "' + title + '"이 하단 탭 이름과 같습니다. 같은 정보를 두 번 보여주지 마세요.',
      actual: 1, limit: rule.limit,
    };
  });
  return found.length ? found : pass('DUP_TITLE', '탭 이름과 중복된 제목 없음');
}

export function checkBoxDepth(files, rule) {
  const out = [];
  for (const file of files) {
    const lines = file.text.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      let depth = 0;
      let max = 0;
      for (const tag of lines[i].matchAll(/<(\/?)div[^>]*>/g)) {
        if (tag[1] === '/') { depth = Math.max(0, depth - 1); continue; }
        if (BOX_CLASS.test(tag[0])) { depth += 1; max = Math.max(max, depth); }
      }
      if (max > rule.limit) {
        out.push({
          rule: 'BOX_DEPTH', level: rule.level, where: file.path + ':' + (i + 1),
          message: '박스가 ' + max + '단 중첩됐습니다. ' + rule.limit + '단까지만 허용합니다. 안쪽 테두리를 없애세요.',
          actual: max, limit: rule.limit,
        });
      }
    }
  }
  return out.length ? out : pass('BOX_DEPTH', '박스 중첩 한도 이내');
}

export function checkLongList(files, rule) {
  const out = [];
  for (const file of files) {
    const counts = new Map();
    for (const m of file.text.matchAll(/className="([^"]+)"/g)) {
      counts.set(m[1], (counts.get(m[1]) ?? 0) + 1);
    }
    for (const [cls, n] of counts) {
      if (n > rule.limit) {
        out.push({
          rule: 'LONG_LIST', level: rule.level, where: file.path + ' (.' + cls + ')',
          message: '같은 항목이 ' + n + '개 이어집니다. 가로 그리드로 접으면 스크롤이 줄어듭니다.',
          actual: n, limit: rule.limit,
        });
      }
    }
  }
  return out.length ? out : pass('LONG_LIST', '긴 세로 나열 없음');
}

export function checkTrustSource(files, rule, trustTerms) {
  if (!trustTerms.length) return pass('TRUST_SOURCE', '공인 검사명 목록이 비어 있어 검사를 건너뜁니다');
  const all = files.map((f) => f.text).join('\n');
  const hits = trustTerms.filter((t) => all.includes(t));
  if (hits.length >= rule.limit) {
    return [{
      rule: 'TRUST_SOURCE', level: 'pass', where: '-',
      message: '공인 검사명 ' + hits.length + '개 확인: ' + hits.join(', '),
      actual: hits.length, limit: rule.limit,
    }];
  }
  return [{
    rule: 'TRUST_SOURCE', level: rule.level, where: '-',
    message: '게임 설명에 공인 검사명이 없습니다. 신뢰 근거가 필요합니다. 후보: ' + trustTerms.join(', '),
    actual: hits.length, limit: rule.limit,
  }];
}

export function runCodeRules(files, config) {
  const r = config.rules;
  return [
    ...checkEmoji(files, r.EMOJI_ICON),
    ...checkGradient(files, r.GRADIENT),
    ...checkRawColor(files, r.RAW_COLOR, config.tokensFile),
    ...checkDupTitle(files, r.DUP_TITLE, config.tabLabels),
    ...checkBoxDepth(files, r.BOX_DEPTH),
    ...checkLongList(files, r.LONG_LIST),
    ...checkTrustSource(files, r.TRUST_SOURCE, config.trustTerms),
  ];
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `cd ~/.claude/skills/ui-loop && node --test test/code-rules.test.mjs`
Expected: PASS — 11 tests

- [ ] **Step 5: 실행부를 쓴다**

`~/.claude/skills/ui-loop/check-code.mjs`:

```js
#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { loadConfig } from './lib/config.mjs';
import { runCodeRules } from './lib/code-rules.mjs';
import { renderReport, worstLevel } from './lib/report.mjs';

const EXT = new Set(['.ts', '.tsx', '.css', '.html']);
const SKIP = new Set(['node_modules', 'dist', '.git', 'coverage']);

function collect(dir, root, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) { collect(full, root, out); continue; }
    const dot = entry.lastIndexOf('.');
    if (dot < 0 || !EXT.has(entry.slice(dot))) continue;
    if (entry.includes('.test.')) continue;
    out.push({ path: relative(root, full), text: readFileSync(full, 'utf8') });
  }
  return out;
}

const projectDir = process.cwd();
const config = loadConfig(projectDir);
const files = collect(join(projectDir, config.src), projectDir);
const findings = runCodeRules(files, config);

const when = new Date().toISOString().slice(0, 16).replace('T', ' ');
const md = renderReport(findings, { title: 'UI 코드 검사', when });
mkdirSync(join(projectDir, 'docs/design'), { recursive: true });
writeFileSync(join(projectDir, 'docs/design/ui-code-report.md'), md + '\n');

console.log(md);
process.exit(worstLevel(findings) === 'fail' ? 1 : 0);
```

- [ ] **Step 6: 전체 테스트를 돌린다**

Run: `chmod +x ~/.claude/skills/ui-loop/check-code.mjs && cd ~/.claude/skills/ui-loop && node --test test/`
Expected: PASS — 15 tests

---

### Task 3: 대비 검증기 연결 (규칙 12)

이 태스크는 대비 계산을 다시 만들지 않는다. 이미 도는 검증기를 호출해 결과만 받아 적는다.

**Files:**
- Create: `~/.claude/skills/ui-loop/lib/contrast.mjs`
- Modify: `~/.claude/skills/ui-loop/check-code.mjs`
- Test: `~/.claude/skills/ui-loop/test/contrast.test.mjs`

**Interfaces:**
- Consumes: `runCodeRules` (Task 2), 기존 `~/.claude/skills/ksleep-design/verify-design-tokens.mjs`
- Produces: `contrastFinding(exitCode: number|null, reportPath: string|null, rule) => Finding`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`~/.claude/skills/ui-loop/test/contrast.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contrastFinding } from '../lib/contrast.mjs';

const RULE = { level: 'fail', limit: 4.5 };

test('검증기가 0을 돌려주면 통과다', () => {
  const f = contrastFinding(0, 'docs/design/token-report.md', RULE);
  assert.equal(f.level, 'pass');
  assert.match(f.message, /token-report\.md/);
});

test('검증기가 0이 아니면 실패다', () => {
  const f = contrastFinding(1, 'docs/design/token-report.md', RULE);
  assert.equal(f.level, 'fail');
});

test('검증기를 못 찾으면 주의로 낮춘다', () => {
  const f = contrastFinding(null, null, RULE);
  assert.equal(f.level, 'warn');
  assert.match(f.message, /검증기/);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `cd ~/.claude/skills/ui-loop && node --test test/contrast.test.mjs`
Expected: FAIL — `Cannot find module '../lib/contrast.mjs'`

- [ ] **Step 3: 구현한다**

`~/.claude/skills/ui-loop/lib/contrast.mjs`:

```js
export function contrastFinding(exitCode, reportPath, rule) {
  if (exitCode === null) {
    return {
      rule: 'CONTRAST', level: 'warn', where: '-',
      message: '대비 검증기를 찾지 못해 검사를 건너뛰었습니다. verify-design-tokens.mjs 경로를 확인하세요.',
      actual: null, limit: rule.limit,
    };
  }
  if (exitCode === 0) {
    return {
      rule: 'CONTRAST', level: 'pass', where: reportPath,
      message: '대비 검증기 통과. 수치는 ' + reportPath + '에만 있습니다.',
      actual: null, limit: rule.limit,
    };
  }
  return {
    rule: 'CONTRAST', level: rule.level, where: reportPath,
    message: '대비 검증기 실패(종료 코드 ' + exitCode + '). ' + reportPath + '를 여세요.',
    actual: null, limit: rule.limit,
  };
}
```

`check-code.mjs`의 import 구역에 아래를 더한다.

```js
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { contrastFinding } from './lib/contrast.mjs';
```

그리고 `const findings = runCodeRules(files, config);` 바로 아래에 아래를 넣는다.

```js
const VERIFIER = join(homedir(), '.claude/skills/ksleep-design/verify-design-tokens.mjs');
const contrastReport = 'docs/design/token-report.md';
let contrastCode = null;
if (config.tokensFile && existsSync(VERIFIER)) {
  const args = ['--css', config.tokensFile, '--src', config.src, '--report', contrastReport];
  if (config.tokenPrefix) args.push('--prefix', config.tokenPrefix);
  if (config.tokenRoles) args.push('--roles', config.tokenRoles);
  contrastCode = spawnSync('node', [VERIFIER, ...args], { cwd: projectDir, encoding: 'utf8' }).status;
}
findings.push(contrastFinding(contrastCode, contrastReport, config.rules.CONTRAST));
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `cd ~/.claude/skills/ui-loop && node --test test/`
Expected: PASS — 18 tests

---

### Task 4: 화면 측정기 — 촬영과 규칙 8~11

측정을 브라우저 안에서 하고 판정을 밖에서 하는 이유는, 판정 규칙을 브라우저 없이 테스트하기 위해서다.

**Files:**
- Create: `~/.claude/skills/ui-loop/lib/screen-rules.mjs`
- Create: `~/.claude/skills/ui-loop/shoot.mjs`
- Test: `~/.claude/skills/ui-loop/test/screen-rules.test.mjs`

**Interfaces:**
- Consumes: `loadConfig`, `renderReport`, `worstLevel` (Task 1)
- Produces:
  - `Measure` 자료형: `{ screen, viewport, scrollHeight, innerHeight, h1, h2, hues, smallTargets }` — `hues`는 숫자 배열, `smallTargets`는 `{label, w, h}` 배열
  - `runScreenRules(measures: Measure[], config) => Finding[]`
  - `MEASURE_JS: string` — 페이지 안에서 실행해 `Measure` 한 건을 JSON으로 돌려주는 스크립트 문자열

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`~/.claude/skills/ui-loop/test/screen-rules.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runScreenRules } from '../lib/screen-rules.mjs';

const CONFIG = {
  rules: {
    SCROLL_BUDGET: { level: 'fail', limit: 1.2 },
    TYPE_SCALE: { level: 'fail', limit: 1.25 },
    HUE_MONOTONE: { level: 'warn', limit: 2, max: 4 },
    TAP_TARGET: { level: 'warn', limit: 44 },
  },
  screens: [{ id: 'home', name: '홈' }, { id: 'play', name: '플레이', scrollBudget: 1.2 }],
};

const BASE = { h1: 30, h2: 20, hues: [250, 190], smallTargets: [] };
const FIT = { scrollHeight: 844, innerHeight: 844 };

test('SCROLL_BUDGET — 플레이 화면 1.39는 실패다 (2026-09-02 실측)', () => {
  const f = runScreenRules([{ ...BASE, screen: 'play', viewport: 'mobile', scrollHeight: 1175, innerHeight: 844 }], CONFIG);
  const hit = f.find((x) => x.rule === 'SCROLL_BUDGET' && x.level === 'fail');
  assert.ok(hit, '1175/844 = 1.39 이므로 실패해야 한다');
  assert.equal(hit.actual, 1.39);
});

test('SCROLL_BUDGET — 홈 화면 1.00은 통과다 (2026-09-02 실측)', () => {
  const f = runScreenRules([{ ...BASE, ...FIT, screen: 'home', viewport: 'mobile' }], CONFIG);
  assert.equal(f.filter((x) => x.rule === 'SCROLL_BUDGET' && x.level === 'fail').length, 0);
});

test('TYPE_SCALE — 22px/19px는 실패다 (2026-09-02 실측)', () => {
  const f = runScreenRules([{ ...BASE, ...FIT, h1: 22, h2: 19, screen: 'home', viewport: 'mobile' }], CONFIG);
  const hit = f.find((x) => x.rule === 'TYPE_SCALE' && x.level === 'fail');
  assert.ok(hit, '22/19 = 1.16 이므로 실패해야 한다');
  assert.equal(hit.actual, 1.16);
});

test('TYPE_SCALE — 30px/20px는 통과다', () => {
  const f = runScreenRules([{ ...BASE, ...FIT, screen: 'home', viewport: 'mobile' }], CONFIG);
  assert.equal(f.filter((x) => x.rule === 'TYPE_SCALE' && x.level === 'fail').length, 0);
});

test('HUE_MONOTONE — 색이 한 계열뿐이면 주의를 낸다', () => {
  const f = runScreenRules([{ ...BASE, ...FIT, hues: [220], screen: 'home', viewport: 'mobile' }], CONFIG);
  const hit = f.find((x) => x.rule === 'HUE_MONOTONE' && x.level === 'warn');
  assert.ok(hit);
  assert.equal(hit.actual, 1);
});

test('HUE_MONOTONE — 5계열이면 너무 많다고 주의를 낸다', () => {
  const f = runScreenRules([{ ...BASE, ...FIT, hues: [0, 60, 120, 200, 300], screen: 'home', viewport: 'mobile' }], CONFIG);
  assert.ok(f.find((x) => x.rule === 'HUE_MONOTONE' && x.level === 'warn' && x.actual === 5));
});

test('TAP_TARGET — 44px 미만 요소를 보고한다', () => {
  const m = { ...BASE, ...FIT, screen: 'home', viewport: 'mobile', smallTargets: [{ label: '자세히', w: 60, h: 28 }] };
  const hit = runScreenRules([m], CONFIG).find((x) => x.rule === 'TAP_TARGET' && x.level === 'warn');
  assert.ok(hit);
  assert.match(hit.message, /자세히/);
});

test('화면별 scrollBudget이 전역 임계값을 덮어쓴다', () => {
  const cfg = { ...CONFIG, screens: [{ id: 'play', name: '플레이', scrollBudget: 1.5 }] };
  const f = runScreenRules([{ ...BASE, screen: 'play', viewport: 'mobile', scrollHeight: 1175, innerHeight: 844 }], cfg);
  assert.equal(f.filter((x) => x.rule === 'SCROLL_BUDGET' && x.level === 'fail').length, 0, '1.39 < 1.5 이므로 통과여야 한다');
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `cd ~/.claude/skills/ui-loop && node --test test/screen-rules.test.mjs`
Expected: FAIL — `Cannot find module '../lib/screen-rules.mjs'`

- [ ] **Step 3: 판정 함수를 구현한다**

`~/.claude/skills/ui-loop/lib/screen-rules.mjs`:

```js
export const MEASURE_JS = [
  '(() => {',
  '  const d = document.documentElement;',
  '  const sizeOf = (sel) => { const el = document.querySelector(sel);',
  '    return el ? parseFloat(getComputedStyle(el).fontSize) : 0; };',
  '  const hueOf = (rgb) => {',
  '    const m = String(rgb).match(/[0-9]+/g);',
  '    if (!m || m.length < 3) return null;',
  '    const r = +m[0], g = +m[1], b = +m[2];',
  '    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);',
  '    if (mx - mn < 18) return null;',
  '    let h = 0;',
  '    if (mx === r) h = 60 * (((g - b) / (mx - mn)) % 6);',
  '    else if (mx === g) h = 60 * ((b - r) / (mx - mn) + 2);',
  '    else h = 60 * ((r - g) / (mx - mn) + 4);',
  '    return Math.round((h + 360) % 360); };',
  '  const buckets = new Set(); const small = [];',
  '  for (const el of document.querySelectorAll("body *")) {',
  '    const cs = getComputedStyle(el);',
  '    if (cs.visibility === "hidden" || cs.display === "none") continue;',
  '    for (const prop of ["color", "backgroundColor", "borderTopColor"]) {',
  '      const h = hueOf(cs[prop]);',
  '      if (h !== null) buckets.add(Math.round(h / 30) * 30); }',
  '    if (el.matches("button, a, [role=button], input, select")) {',
  '      const r2 = el.getBoundingClientRect();',
  '      if (r2.width > 0 && Math.min(r2.width, r2.height) < 44) {',
  '        small.push({ label: (el.innerText || el.getAttribute("aria-label") || el.tagName).trim().slice(0, 20),',
  '                     w: Math.round(r2.width), h: Math.round(r2.height) }); } } }',
  '  return JSON.stringify({ scrollHeight: d.scrollHeight, innerHeight: window.innerHeight,',
  '    h1: sizeOf("h1"), h2: sizeOf("h2"), hues: [...buckets], smallTargets: small.slice(0, 8) });',
  '})()',
].join('\n');

const round2 = (n) => Math.round(n * 100) / 100;

export function runScreenRules(measures, config) {
  const r = config.rules;
  const out = [];

  for (const m of measures) {
    const screen = config.screens.find((s) => s.id === m.screen);
    const where = (screen?.name ?? m.screen) + ' (' + m.viewport + ')';

    const ratio = round2(m.scrollHeight / m.innerHeight);
    const budget = screen?.scrollBudget ?? r.SCROLL_BUDGET.limit;
    out.push(ratio > budget
      ? { rule: 'SCROLL_BUDGET', level: r.SCROLL_BUDGET.level, where, actual: ratio, limit: budget,
          message: '한 화면에 안 들어갑니다. 항목을 가로로 접거나 덜 중요한 것을 빼세요.' }
      : { rule: 'SCROLL_BUDGET', level: 'pass', where, actual: ratio, limit: budget, message: '스크롤 예산 이내' });

    if (m.h1 > 0 && m.h2 > 0) {
      const scale = round2(m.h1 / m.h2);
      out.push(scale < r.TYPE_SCALE.limit
        ? { rule: 'TYPE_SCALE', level: r.TYPE_SCALE.level, where, actual: scale, limit: r.TYPE_SCALE.limit,
            message: '제목(' + m.h1 + 'px)과 소제목(' + m.h2 + 'px)이 거의 같은 크기라 위계가 안 보입니다.' }
        : { rule: 'TYPE_SCALE', level: 'pass', where, actual: scale, limit: r.TYPE_SCALE.limit, message: '제목 위계 충분' });
    }

    const hueCount = m.hues.length;
    if (hueCount < r.HUE_MONOTONE.limit) {
      out.push({ rule: 'HUE_MONOTONE', level: r.HUE_MONOTONE.level, where, actual: hueCount, limit: r.HUE_MONOTONE.limit,
        message: '색이 한 계열뿐이라 구분이 안 됩니다. 강조색을 하나 더 쓰세요.' });
    } else if (hueCount > r.HUE_MONOTONE.max) {
      out.push({ rule: 'HUE_MONOTONE', level: r.HUE_MONOTONE.level, where, actual: hueCount, limit: r.HUE_MONOTONE.max,
        message: '색이 너무 많아 산만합니다. 한 화면 강조색은 2개까지입니다.' });
    } else {
      out.push({ rule: 'HUE_MONOTONE', level: 'pass', where, actual: hueCount, limit: r.HUE_MONOTONE.limit, message: '색 종류 적정' });
    }

    out.push(m.smallTargets.length
      ? { rule: 'TAP_TARGET', level: r.TAP_TARGET.level, where, actual: m.smallTargets.length, limit: r.TAP_TARGET.limit,
          message: '44px보다 작은 누를 거리: ' + m.smallTargets.map((t) => t.label + '(' + t.w + '×' + t.h + ')').join(', ') }
      : { rule: 'TAP_TARGET', level: 'pass', where, actual: 0, limit: r.TAP_TARGET.limit, message: '터치 영역 충분' });
  }

  return out;
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `cd ~/.claude/skills/ui-loop && node --test test/screen-rules.test.mjs`
Expected: PASS — 8 tests

- [ ] **Step 5: 촬영 실행부를 쓴다**

`~/.claude/skills/ui-loop/shoot.mjs`:

```js
#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { loadConfig } from './lib/config.mjs';
import { runScreenRules, MEASURE_JS } from './lib/screen-rules.mjs';
import { renderReport, worstLevel } from './lib/report.mjs';

const CANDIDATES = [
  join(homedir(), '.local/bin/browse'),
  join(homedir(), '.claude/skills/gstack/browse/dist/browse'),
];
const BROWSE = CANDIDATES.find(existsSync);
if (!BROWSE) {
  console.error('browse를 찾지 못했습니다. 확인한 경로:\n  ' + CANDIDATES.join('\n  '));
  process.exit(2);
}

const run = (...args) => spawnSync(BROWSE, args, { encoding: 'utf8' });
const lastLine = (out) => (out ?? '').trim().split('\n').filter(Boolean).pop() ?? '';

const projectDir = process.cwd();
const config = loadConfig(projectDir);
const shotDir = join(projectDir, 'docs/design/shots');
mkdirSync(shotDir, { recursive: true });

const measures = [];
for (const vp of config.viewports) {
  run('viewport', vp.size);
  for (const screen of config.screens) {
    run('goto', config.baseUrl);
    if (screen.open) run('js', screen.open);
    run('wait', '600');
    run('screenshot', join(shotDir, screen.id + '-' + vp.name + '.png'));
    const raw = lastLine(run('js', MEASURE_JS).stdout);
    try {
      measures.push({ screen: screen.id, viewport: vp.name, ...JSON.parse(raw) });
    } catch {
      console.error('측정 실패: ' + screen.id + '/' + vp.name + ' — browse 응답: ' + raw.slice(0, 120));
      process.exit(2);
    }
  }
}

const findings = runScreenRules(measures, config);
const when = new Date().toISOString().slice(0, 16).replace('T', ' ');
const md = renderReport(findings, { title: 'UI 화면 검사', when });
writeFileSync(join(projectDir, 'docs/design/ui-screen-report.md'), md + '\n');

console.log(md);
console.log('\n스크린샷: ' + shotDir);
process.exit(worstLevel(findings) === 'fail' ? 1 : 0);
```

- [ ] **Step 6: 전체 테스트를 돌린다**

Run: `chmod +x ~/.claude/skills/ui-loop/shoot.mjs && cd ~/.claude/skills/ui-loop && node --test test/`
Expected: PASS — 26 tests

---

### Task 5: SKILL.md — 게이트 순서와 기존 스킬 라우팅

**Files:**
- Create: `~/.claude/skills/ui-loop/SKILL.md`

**Interfaces:**
- Consumes: Task 1~4의 스크립트 경로
- Produces: `/ui-loop`으로 부를 수 있는 스킬

- [ ] **Step 1: SKILL.md를 쓴다**

frontmatter는 아래 두 줄이다.

- `name: ui-loop`
- `description: Use when building, changing, or reviewing any user-facing screen. Runs five gates so screen quality is judged by measurements, not by feel. Triggers - 화면 만들기, UI 고치기, 디자인 개선, 화면이 이상해, 못생겼어, 스크롤이 너무 길어, UI 검사, 디자인 QA.`

본문은 아래 내용을 담는다.

**언제 어느 게이트부터 시작하나**

| 하려는 일 | 시작 게이트 |
|---|---|
| 새 화면을 만든다 | G1 |
| 기존 화면의 구조·정보를 바꾼다 | G1 |
| 기존 화면의 겉모습만 다듬는다 | G2 |
| 이미 고쳤고 확인만 하려 한다 | G3 |
| 배포 직전 최종 확인 | G3 → G4 → G5 |

**G1 — 화면 계약 (사람, 5분)**

`docs/design/screens.md`에 화면당 5줄(목적 / 주 행동 / 스크롤 예산 / 강조색 2개 / 금지)을 적는다.
**목적을 한 문장으로 못 적으면 그 화면은 만들지 않는다.**

**G2 — 시안 비교 (사용자가 고른다)**

바로 코딩하지 않는다. 정적 HTML 시안 2~3개를 만들고 스크린샷을 나란히 보여준다.
실제 토큰과 실제 문구를 쓴다. 로렘입숨 금지. 시안끼리 접근 방식이 달라야 하며 색만 바꾼 대조군은 만들지 않는다.
사용자가 번호를 고른 뒤에만 실제 구현을 시작한다. **취향은 AI가 결정하지 않는다. 이 게이트를 건너뛰지 않는다.**

**G3 — 코드 검사 (자동, 빠름)**

`node ~/.claude/skills/ui-loop/check-code.mjs` — 브라우저를 안 띄우므로 자주 돌린다.
리포트: `docs/design/ui-code-report.md`

**G4 — 화면 검사 (자동 + 눈으로 봄)**

`node ~/.claude/skills/ui-loop/shoot.mjs` 로 촬영·측정한 뒤,
**찍힌 PNG를 Read 도구로 직접 열어본다.** 숫자가 통과해도 눈으로 봐야 하는 것이 있다.

- 어디를 먼저 봐야 할지 3초 안에 알겠는가
- 같은 정보가 두 번 나오는가
- 모든 것이 박스에 들어가 답답한가
- 주 버튼이 한눈에 가장 눈에 띄는가

고치고 다시 촬영한다. 통과할 때까지 반복한다.

**G5 — 승인 (사용자)**

제출물은 before 스크린샷, after 스크린샷, 바뀐 점 3줄 세 개뿐이다.
사용자는 OK 또는 NO만 답한다. NO면 G2로 돌아간다.

**기존 스킬을 언제 부르는가**

| 상황 | 부를 것 | 게이트 |
|---|---|---|
| 디자인 시스템이 아예 없다 | `design-consultation` | G1 앞 |
| K-Sleep 제품이다 | `ksleep-design` | G1 |
| 시안을 여러 개 만든다 | `/design` 캔버스, 없으면 `design-shotgun` | G2 |
| 랜딩·마케팅 페이지다 | `design-taste-frontend` | G2 |
| 이미지를 먼저 만들고 코드로 옮긴다 | `image-to-code` | G2 |
| 계획 단계 디자인 검토 | `plan-design-review` | G1~G2 |
| 접근성·웹 표준 코드 검토 | `web-design-guidelines` | G3 |
| 라이브 화면 시각 QA와 자동 수정 | `design-review` | G4 |
| 동작 버그까지 훑는다 | `qa` | G4 뒤 |

**프로젝트에 처음 붙일 때**

1. `ui-loop.config.json`을 프로젝트 루트에 만든다.
2. `docs/design/screens.md`에 화면 계약을 적는다.
3. `package.json`에 `ui:check`, `ui:shots`, `ui` 스크립트를 더한다.

설정 파일 예시:

```json
{
  "baseUrl": "http://localhost:5173",
  "src": "src",
  "tokensFile": "src/tokens.css",
  "tokenPrefix": "g",
  "tokenRoles": "design-tokens.roles.json",
  "viewports": [
    { "name": "mobile", "size": "390x844" },
    { "name": "desktop", "size": "1440x900" }
  ],
  "tabLabels": ["홈", "플레이", "나의 변화", "게임 안내"],
  "trustTerms": ["PVT", "Stroop", "Digit Span"],
  "screens": [
    { "id": "home", "name": "홈", "open": "document.querySelectorAll('.tab-button')[0].click()" }
  ],
  "rules": {}
}
```

**규칙을 못 지키겠을 때**

임계값을 코드에서 바꾸지 않는다. `ui-loop.config.json`의 `rules`에서 덮어쓰고,
**왜 바꿨는지를 커밋 메시지에 남긴다.** 근거 없는 완화는 규칙을 무의미하게 만든다.

- [ ] **Step 2: 스킬이 인식되는지 확인한다**

Run: `head -5 ~/.claude/skills/ui-loop/SKILL.md && ls ~/.claude/skills/ui-loop/`
Expected: frontmatter의 `name: ui-loop`가 보이고, `check-code.mjs`, `shoot.mjs`, `lib/`, `test/`, `rules.default.json`이 있다.

---

### Task 6: 이 프로젝트에 설치

**Files:**
- Create: `ui-loop.config.json`
- Create: `docs/design/screens.md`
- Modify: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: Task 1~5 전부
- Produces: `npm run ui:check`, `npm run ui:shots`, `npm run ui`

- [ ] **Step 1: 설정 파일을 쓴다**

`ui-loop.config.json`:

```json
{
  "baseUrl": "https://ksleep-care-cognitive-check.vercel.app/",
  "src": "src",
  "tokensFile": "src/tokens.css",
  "tokenPrefix": "g",
  "tokenRoles": "design-tokens.roles.json",
  "viewports": [
    { "name": "mobile", "size": "390x844" },
    { "name": "desktop", "size": "1440x900" }
  ],
  "tabLabels": ["홈", "플레이", "나의 변화", "게임 안내"],
  "trustTerms": ["PVT", "Psychomotor Vigilance", "Stroop", "Digit Span"],
  "screens": [
    { "id": "home",  "name": "홈",       "open": "document.querySelectorAll('.tab-button')[0].click()", "scrollBudget": 1.2 },
    { "id": "play",  "name": "플레이",    "open": "document.querySelectorAll('.tab-button')[1].click()", "scrollBudget": 1.2 },
    { "id": "trend", "name": "나의 변화", "open": "document.querySelectorAll('.tab-button')[2].click()", "scrollBudget": 1.5 },
    { "id": "guide", "name": "게임 안내", "open": "document.querySelectorAll('.tab-button')[3].click()", "scrollBudget": 2.0 }
  ],
  "rules": {}
}
```

`trend`와 `guide`의 예산이 더 큰 이유: 추이 그래프와 설명 문서는 성격상 길다.
`home`과 `play`는 **결정을 내리는 화면**이므로 한 화면에 들어와야 한다.

- [ ] **Step 2: 화면 계약서를 쓴다**

`docs/design/screens.md`에 아래 5개 화면 표를 쓴다.

**홈** — 목적: 처음 온 사람이 이걸 해볼지 말지 3초 안에 정하게 만든다 / 주 행동: 3분 측정 시작 / 스크롤 예산: 1.2 / 강조색: violet(주 행동), lime(안심 문구) / 금지: 게임 목록 나열 금지 — 그건 플레이 화면 일이다

**플레이** — 목적: 난이도를 고르고 바로 시작하게 만든다 / 주 행동: 시작하기 / 스크롤 예산: 1.2 / 강조색: violet(선택된 난이도), cyan(진행) / 금지: 게임 7개 세로 나열 금지. 가로 그리드로 접는다

**나의 변화** — 목적: 내 값이 기준선 대비 어떻게 달라졌는지 보여준다 / 주 행동: 없음(읽는 화면) / 스크롤 예산: 1.5 / 강조색: cyan(오늘), muted(기준선) / 금지: 정상·비정상 판정 금지. 연령 백분위 금지

**게임 안내** — 목적: 각 과제가 어느 공인 검사를 줄인 것인지 알려 신뢰를 준다 / 주 행동: 없음(읽는 화면) / 스크롤 예산: 2.0 / 강조색: violet(과제 이름), muted(출처) / 금지: 의료 진단 표현 금지

**PVT 측정 화면** — 목적: 반응시간을 오염 없이 3분간 측정한다 / 주 행동: 화면 누르기 / 스크롤 예산: 1.0(스크롤 금지) / 강조색: cyan(타깃) 하나만 / 금지: tilt·파티클·패럴랙스·스프링 이동·움직이는 배경 전부 금지. 반응시간이 오염된다

- [ ] **Step 3: package.json에 스크립트를 더한다**

`"test:watch": "vitest"` 아래에 세 줄을 넣는다.

```json
"ui:check": "node ~/.claude/skills/ui-loop/check-code.mjs",
"ui:shots": "node ~/.claude/skills/ui-loop/shoot.mjs",
"ui": "npm run ui:check && npm run ui:shots"
```

- [ ] **Step 4: 스크린샷을 git에서 뺀다**

`.gitignore`에 아래 두 줄을 더한다. 리포트는 남기고 이미지만 뺀다.

```
docs/design/shots/
.gstack/
```

- [ ] **Step 5: 설정이 읽히는지 확인한다**

Run: `node -e "import(process.env.HOME+'/.claude/skills/ui-loop/lib/config.mjs').then(m=>console.log(JSON.stringify(m.loadConfig(process.cwd()).screens.map(s=>s.id))))"`
Expected: `["home","play","trend","guide"]`

- [ ] **Step 6: 커밋한다**

```bash
git add ui-loop.config.json docs/design/screens.md package.json .gitignore
git commit -m "feat: UI 루프 설정과 화면 계약서 추가"
```

---

### Task 7: 기준선 실행 — 검사기가 실제 문제를 잡는지 확인

이 태스크가 **합격 판정**이다. 화면을 아직 고치지 않은 상태에서 돌려, 스펙에 적힌 문제가 전부 잡히는지 본다.

**Files:**
- Create: `docs/design/ui-code-report.md` (생성물)
- Create: `docs/design/ui-screen-report.md` (생성물)

**Interfaces:**
- Consumes: Task 6의 `npm run ui`
- Produces: 기준선 리포트 2개

- [ ] **Step 1: 코드 검사를 돌린다**

Run: `npm run ui:check`
Expected: 종료 코드 1. 리포트에 아래가 **전부** 나와야 한다.

| 규칙 | 기대 |
|---|---|
| `EMOJI_ICON` | 실패. `src/domain/session.ts:96` 포함 |
| `GRADIENT` | 실패. `src/styles.css:217`, `src/styles.css:331` 포함 |
| `DUP_TITLE` | 실패. 플레이 |
| `TRUST_SOURCE` | 실패 |
| `CONTRAST` | 통과 |

- [ ] **Step 2: 안 잡힌 것이 있으면 규칙을 고친다**

기대와 다르면 규칙 함수가 잘못된 것이다. `lib/code-rules.mjs`를 고치고 Task 2의 테스트를 다시 돌린 뒤 Step 1로 돌아간다.
**리포트를 손으로 고치지 않는다.**

- [ ] **Step 3: 화면 검사를 돌린다**

Run: `npm run ui:shots`
Expected: 종료 코드 1. 리포트에 아래가 나와야 한다.

| 규칙 | 화면 | 기대 |
|---|---|---|
| `SCROLL_BUDGET` | 홈 (mobile) | 통과, 실측 1.0 |
| `SCROLL_BUDGET` | 플레이 (mobile) | **실패**, 실측 1.39 |
| `TYPE_SCALE` | 홈 (mobile) | **실패**, 실측 1.16 |

- [ ] **Step 4: 스크린샷을 눈으로 확인한다**

`docs/design/shots/`의 PNG를 Read 도구로 연다. 8장(화면 4 × 뷰포트 2)이 있어야 하고,
실제 화면이 찍혔는지(빈 화면이 아닌지) 확인한다.

- [ ] **Step 5: 기준선을 커밋한다**

```bash
git add docs/design/ui-code-report.md docs/design/ui-screen-report.md
git commit -m "test: UI 루프 기준선 리포트 (고치기 전)"
```

---

### Task 8: 실제 화면 고치기 — G2부터

**여기서 사용자의 선택이 필요하다.** 앞 태스크와 성격이 다르다.

**Files:**
- Create: `docs/design/mockups/<화면>-<안번호>.html`
- Modify: 선택된 안에 따라 `src/` 아래 파일들, `index.html`

**Interfaces:**
- Consumes: Task 7의 기준선 리포트
- Produces: 전 규칙 통과 상태의 화면

- [ ] **Step 1: 홈 화면 시안 3개를 만든다**

기준선 리포트가 지적한 것을 각각 다른 방식으로 푼다. 실제 토큰과 실제 문구를 쓴다.

- 1안: 홈 탭을 없애고 앱을 **플레이 화면으로 바로 연다.** (지적 1번 "이 화면이 불필요하다"를 정면으로 받는 안)
- 2안: 홈을 남기되 **한 화면 한 행동**으로 줄인다. 카드 3개 → 주 행동 1개 + 안심 한 줄.
- 3안: 홈을 **오늘의 상태 카드**로 바꾼다. 어제 값 대비 오늘을 먼저 보여주고 측정으로 유도.

각 시안을 `browse`로 촬영해 나란히 놓는다.

- [ ] **Step 2: 사용자가 고른다**

번호만 받는다. 고르기 전에는 `src/`를 건드리지 않는다.

- [ ] **Step 3: 이모지를 SVG 아이콘으로 바꾼다**

`src/domain/session.ts`의 `TAB_META.icon`을 이모지 문자에서 아이콘 이름으로 바꾸고,
`src/ui/Icon.tsx`를 새로 만들어 인라인 SVG를 그린다. 48곳 전부 바꾼다.

- [ ] **Step 4: 그라데이션 버튼을 단색으로 바꾼다**

`src/styles.css:217`, `src/styles.css:331`의 `linear-gradient(...)`를 `var(--g-violet)` 단색으로 바꾼다.

- [ ] **Step 5: 제목 위계를 벌린다**

h1과 h2의 크기 비가 1.25 이상이 되게 `src/styles.css`를 고친다. 계산 근거를 주석으로 남긴다.

- [ ] **Step 6: 플레이 화면의 세로 나열을 가로 그리드로 접는다**

게임 7개 목록을 2열 또는 3열 그리드로 바꿔 스크롤 비를 1.2 이하로 만든다.

- [ ] **Step 7: 게임 안내에 공인 검사 출처를 넣는다**

각 게임 설명에 원본 검사명을 한 줄 추가한다. 진단 표현은 넣지 않는다.

- [ ] **Step 8: theme-color를 고친다**

`index.html`의 `<meta name="theme-color" content="#FAF8F2">`를 `src/tokens.css`의 `--g-void` 값(`#070A16`)으로 바꾼다.

- [ ] **Step 9: 전 게이트를 다시 돌린다**

Run: `npm test && npm run ui`
Expected: 전부 통과, 종료 코드 0

- [ ] **Step 10: before/after를 사용자에게 제출한다**

before 스크린샷, after 스크린샷, 바뀐 점 3줄. OK를 받으면 커밋한다.

---

## Self-Review

**스펙 커버리지**

| 스펙 항목 | 담당 태스크 |
|---|---|
| G1 화면 계약 | Task 6 Step 2, Task 5 (절차) |
| G2 시안 비교 | Task 5 (절차), Task 8 Step 1~2 |
| G3 코드 검사 | Task 2, Task 3 |
| G4 화면 검사 | Task 4 |
| G5 승인 | Task 5 (절차), Task 8 Step 10 |
| 규칙 1~7 | Task 2 |
| 규칙 8~11 | Task 4 |
| 규칙 12 대비 | Task 3 |
| 규칙 13 화면 목적 | Task 6 Step 2 |
| 규칙 14 취향 | Task 8 Step 2 |
| 만들 것 전부 | Task 1~6 |
| 기존 스킬 라우팅 | Task 5 |
| 검증 방법 | Task 7 |
| 위험 대응 (warn 등급) | Task 1 Step 1 — `LONG_LIST`, `HUE_MONOTONE`, `TAP_TARGET`을 warn으로 |
| browse 깨질 때 대체 경로 | Task 4 Step 5 — `CANDIDATES` 배열 |
| PVT 예외 | Task 6 Step 2 — screens.md 금지 칸 |

빠진 항목 없음.

**자료형 일관성**

- `Finding`의 칸 이름(`rule`, `level`, `where`, `message`, `actual`, `limit`)이 Task 1·2·3·4에서 동일하다.
- `loadConfig`가 돌려주는 칸(`src`, `tokensFile`, `tokenPrefix`, `tokenRoles`, `baseUrl`, `viewports`, `screens`, `tabLabels`, `trustTerms`, `rules`)을 Task 2·3·4·6이 같은 이름으로 쓴다.
- `Measure`의 칸(`screen`, `viewport`, `scrollHeight`, `innerHeight`, `h1`, `h2`, `hues`, `smallTargets`)이 `MEASURE_JS` 출력과 `runScreenRules` 입력에서 일치한다.

**미완성 표시** 없음.
