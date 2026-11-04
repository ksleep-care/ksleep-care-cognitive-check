---
title: 인지 컨디션 체크 이전 구현 계획
path: docs/superpowers/plans/_archive/20260831_product_plan_korean-cognitive-check.md
status: superseded
superseded_by: docs/ux-game-revision.md
---
> 폐기 문서. 2026-09-07 사용자 요청에 따른 현재 계약은 docs/ux-game-revision.md이다. 아래는 이전 구현 이력이다.

# 한글 인지 컨디션 체크 구현 계획

**Goal:** 게임형 UX와 표준화된 3분 PVT 측정, 개인 기준선을 갖춘 독립 웹앱을 Vercel Production에 배포함.

**Spec:** `docs/superpowers/specs/20260831_product_design_korean-cognitive-check.md`
**Design:** root `DESIGN.md` · 대비 수치는 `docs/design/token-report.md`에만 존재함

**Tech Stack:** React 19, TypeScript 7, Vite 8, Vitest, Testing Library, CSS, Vercel

## Global Constraints

- `ksleep-app` 코드·API·DB·인증·쿠키와 연결하지 않음.
- 저장은 기본 꺼짐. 명시 동의 뒤 PVT 요약값 6개 필드만 `localStorage`에 둠. 서버 전송 없음.
- 실제 환자정보나 개인정보 입력을 받지 않음.
- 의료 진단·정상/비정상 판정·연령 percentile·ADHD 점수를 만들지 않음.
- 레벨은 3분 PVT에 영향을 주지 않음.
- 390px, 768px, 1440px를 확인함.

---

## Phase 1 — 완료 (2026-08-31)

게임 7개, 단선 흐름, 비저장 계약, 환자용 토큰, Vercel 배포. 21개 테스트 통과.

---

## Phase 2 — 게임형 UX와 3분 PVT (2026-09-01)

### Task 1: 측정 도메인 — 실패 테스트 먼저

**Files:** `src/domain/pvt.ts`, `src/domain/pvtEngine.ts`, `src/domain/baseline.ts`
**Test:** `src/domain/pvt.test.ts`, `src/domain/pvtEngine.test.ts`, `src/domain/baseline.test.ts`

- [x] **Step 1: 논문 원문(Basner 2011) Material and methods를 직접 읽고 측정 계약을 확정함**

제목이나 2차 요약을 믿지 않음. 확정값: 3분 / ISI 2~4초 / 100ms 미만 false start /
30초 무응답 lapse / lapse ≥ 355ms / 수행 점수 정의. 10분 PVT의 500ms와 섞지 않음.

- [x] **Step 2: 경계값 실패 테스트를 먼저 작성함**

354 vs 355ms, 99 vs 100ms, 무응답, 빈 입력, 짝수 개 중앙값, 수행 점수, 후반부 변화,
품질 4종(자극 부족·탭 이탈·false start 과다·타이머 밀림).

- [x] **Step 3: 저장 schema 실패 테스트를 먼저 작성함**

동의 전 저장소 비어 있음, 허용 필드 6개만 통과, 개인정보 필드 잘라냄, 상한 30개,
삭제, 깨진 JSON, 모르는 schema 버전, 기준선 0·1·2·3·5회 경계, 프로토콜 버전 불일치.

- [x] **Step 4: 통과시킴**

Run: `npx vitest run src/domain`
Expected: PASS.

- [x] **Step 5: 시행 진행을 React 밖의 `PvtEngine`으로 옮기고 시계·타이머를 주입 가능하게 함**

화면 재렌더링이 자극 타이밍을 흔들지 않게 하고 경계값을 손으로 굴려 테스트하기 위함.

### Task 2: 게임 전용 정보 구조

**Files:** `src/components/TabBar.tsx`, `HomeTab.tsx`, `PlayTab.tsx`, `TrendTab.tsx`, `GuideTab.tsx`, `src/App.tsx`

- [x] **Step 1: 하단 탭 4개(`홈 / 플레이 / 나의 변화 / 게임 안내`)를 만듦**

K-Sleep 앱의 5탭을 복사하지 않음. `aria-current`로 현재 위치를 알림.

- [x] **Step 2: 세션과 3분 측정 중에는 탭을 숨김**

Run: `npx vitest run src/App.test.tsx`
Expected: 세션·측정 화면에서 `navigation` 없음.

- [x] **Step 3: 레벨 1~4를 복구하고 기억·숫자·색깔·패턴에만 적용함**

`src/domain/levels.ts`가 레벨별 설정의 정본. `GAME_META[key].scalesWithLevel`로 고정 여부를 표시.

- [x] **Step 4: 숫자 뒤집기를 직접 입력 + Enter 제출 + 숫자 전용으로 만듦**

### Task 3: 문제별 즉시 피드백

**Files:** `src/ui/Feedback.tsx`, `src/games/*.tsx`

- [x] **Step 1: 정오답 → 정답 → 한 줄 설명 → 사용자가 다음으로 넘어가는 공용 컴포넌트를 만듦**
- [x] **Step 2: 최초 제출로만 점수가 확정되는 것을 테스트로 고정함**

정답을 본 뒤 정답 버튼을 다시 눌러도 `correct: 0`이 유지되는지 확인함.

- [x] **Step 3: 반응·별똥별은 시행마다 ms 또는 이른 누름/놓침을 즉시 알림**
- [x] **Step 4: PVT는 중립 문구만 줌**

`152` / `너무 빨라요` / `아직이에요` / `놓쳤어요`. 축하 particle·흔들림·화면 이동 없음.

### Task 4: 이중 결과와 개인 기준선

**Files:** `src/domain/scoring.ts`, `src/domain/pvtReport.ts`, `src/components/MetricList.tsx`, `Report.tsx`, `PvtReport.tsx`

- [x] **Step 1: 모든 결과 카드가 5가지를 함께 주게 함**

무엇을 본 과제 / 이번 값 / 읽는 방향 / 비교 가능한 범위 / 한계.

- [x] **Step 2: 연구 참고 층에 출처와 `의료 기준이 아님`을 함께 붙임**
- [x] **Step 3: 개인 기준선 층을 `n/3` → 최근 5회 중앙값 비교로 구현함**
- [x] **Step 4: 이번 결과를 넣기 전의 기록으로 비교하도록 고정함**

자기 자신을 기준선에 섞지 않음.

- [x] **Step 5: 품질 문제가 있는 측정은 저장하지 않고 `다시 측정 권장`으로 표시함**

### Task 5: 새 시각 디자인

**Files:** `DESIGN.md`, `src/tokens.css`, `src/styles.css`, `design-tokens.roles.json`

- [x] **Step 1: `DESIGN.md`에 색·깊이·모션·PVT 비장식 구간·reduced-motion 대체를 한 문서로 적음**
- [x] **Step 2: 어두운 게임 팔레트를 만들고 검증기를 돌림**

Run: `node ~/.claude/skills/ksleep-design/verify-design-tokens.mjs --css src/tokens.css --prefix g --roles design-tokens.roles.json --src src --report docs/design/token-report.md`
Expected: 위반 0건.

- [x] **Step 3: PVT 측정 화면에서 배경 애니메이션까지 정지시킴 (`.is-measuring`)**

실제 브라우저에서 `animationName: none`, `opacity: 0.22` 확인함.

- [x] **Step 4: `prefers-reduced-motion` 정적 대체를 넣음**

선택 상태를 색이 아닌 테두리 굵기로도 구분함.

### Task 6: 검증, 배포, live 증거

- [x] **Step 1: 전체 검사**

Run: `npm run check && npm test && npm run build`
Expected: 모두 exit 0.

- [ ] **Step 2: 실제 브라우저 QA**

390px·768px·1440px에서 홈 → 레벨 → 게임 7개 → 문제별 정오답 → 3분 PVT → 결과 →
저장 동의 → 나의 변화 → 삭제 → 다시 시작. 가로 넘침 0.

- [ ] **Step 3: 품질 경고 QA**

탭 백그라운드 이탈과 false start 과다를 만들어 `다시 측정 권장`이 뜨는지 확인.

- [ ] **Step 4: 선별 stage 후 한 목적의 commit, 전용 branch에만 push**

Run: `git add <정확한 경로>` → `git status --short` → `git diff --cached --name-only`
→ staged diff → `git diff --check` → `git push origin feat/korean-cognitive-check`
PR·merge·기본 branch push·force push 없음.

- [ ] **Step 5: Vercel Production 배포와 live 확인**

Run: `vercel deploy --prod --yes` → `curl -fsS -o /dev/null -w '%{http_code}' <production-url>`
Expected: ready + HTTP 200 + 배포된 화면에서 새 문구 확인.
