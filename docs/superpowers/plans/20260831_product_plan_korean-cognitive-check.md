# 한글 인지 컨디션 체크 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 로그인과 서버 없이 7개 한글 인지 활동을 완료하고 즉시 결과를 확인하는 독립 웹앱을 Vercel Production에 배포함.

**Architecture:** Vite 기반 React 단일 페이지 앱으로 구현함. 검사 순서와 점수는 순수 TypeScript 도메인 함수로 분리하고, 각 게임은 완료 결과만 상위 상태 머신에 전달함. 데이터는 React 메모리에만 존재함.

**Tech Stack:** React 19, TypeScript 7, Vite 8, Vitest, Testing Library, CSS, Vercel

**Spec:** `docs/superpowers/specs/20260831_product_design_korean-cognitive-check.md`

## Global Constraints

- `ksleep-app` 코드, API, DB, 인증, 쿠키와 연결하지 않음.
- 결과를 서버, `localStorage`, `sessionStorage`, 쿠키에 저장하지 않음.
- 실제 환자정보나 개인정보 입력을 받지 않음.
- 7개 활동을 승인된 순서로 제공함.
- 의료 진단이나 정상/비정상 판정을 제공하지 않음.
- 390px, 768px, 1440px 화면을 확인함.

---

### Task 1: 프로젝트 기반과 검사 도메인

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.setup.ts`, `index.html`
- Create: `src/domain/types.ts`, `src/domain/session.ts`, `src/domain/scoring.ts`
- Test: `src/domain/session.test.ts`, `src/domain/scoring.test.ts`

**Interfaces:**
- Produces: `GAME_ORDER`, `nextStep(step)`, `calculateReport(results)`를 이후 화면이 사용함.

- [x] **Step 1: React/Vite/Vitest 설정 파일을 만들고 의존성을 설치함**

Run: `npm install react react-dom pretendard && npm install -D typescript vite @vitejs/plugin-react vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/react @types/react-dom`

- [x] **Step 2: `GAME_ORDER`, `nextStep`, `calculateReport`의 실패 테스트를 작성함**

```ts
expect(GAME_ORDER).toEqual(['story', 'reaction', 'digit', 'stroop', 'storyDelayed', 'pattern', 'vigilance']);
expect(nextStep({ type: 'game', index: 6 })).toEqual({ type: 'report' });
expect(calculateReport(fixture).memoryRetention).toBe(75);
```

- [x] **Step 3: 테스트가 모듈 부재로 실패하는지 확인함**

Run: `npm test -- src/domain/session.test.ts src/domain/scoring.test.ts`
Expected: FAIL because `session.ts` and `scoring.ts` do not exist.

- [x] **Step 4: 테스트가 요구하는 도메인 계약만 구현함**

```ts
export const GAME_ORDER = ['story', 'reaction', 'digit', 'stroop', 'storyDelayed', 'pattern', 'vigilance'] as const;
export function nextStep(step: SessionStep): SessionStep;
export function calculateReport(results: SessionResults): CognitiveReport;
```

- [x] **Step 5: 전체 도메인 테스트를 다시 실행함**

Run: `npm test -- src/domain/session.test.ts src/domain/scoring.test.ts`
Expected: PASS with 0 failed tests.

### Task 2: 7개 활동과 전체 흐름

**Files:**
- Create: `src/games/StoryGame.tsx`, `src/games/ReactionGame.tsx`, `src/games/DigitSpanGame.tsx`
- Create: `src/games/StroopGame.tsx`, `src/games/PatternGame.tsx`, `src/games/VigilanceGame.tsx`
- Create: `src/components/Intro.tsx`, `src/components/Transition.tsx`, `src/components/Report.tsx`
- Create: `src/App.tsx`, `src/main.tsx`
- Test: `src/App.test.tsx`, `src/games/games.test.tsx`

**Interfaces:**
- Consumes: `GameResult`, `GAME_ORDER`, `calculateReport`.
- Produces: 각 게임은 `onComplete(result)`를 정확히 한 번 호출함. `App`은 7번째 결과 뒤 보고서를 표시함.

- [x] **Step 1: 첫 화면, 전환, 결과 화면과 게임 완료 계약의 실패 테스트를 작성함**

```tsx
render(<App />);
expect(screen.getByRole('heading', { name: '인지 컨디션 체크' })).toBeInTheDocument();
await user.click(screen.getByRole('button', { name: '검사 시작' }));
expect(screen.getByRole('heading', { name: '이야기 기억하기' })).toBeInTheDocument();
```

각 게임 테스트는 정답·오답 입력 후 `onComplete`가 한 번 호출되고 결과 객체의 숫자 필드가 유효한지 확인함.

- [x] **Step 2: 테스트가 화면 또는 컴포넌트 부재로 실패하는지 확인함**

Run: `npm test -- src/App.test.tsx src/games/games.test.tsx`
Expected: FAIL because `App` and game components do not exist.

- [x] **Step 3: 동일한 완료 계약으로 6개 컴포넌트에 7개 활동을 구현함**

```ts
type GameProps<K extends GameKey> = {
  onComplete: (result: SessionResults[K]) => void;
};
```

`StoryGame`은 `mode: 'immediate' | 'delayed'`로 두 활동을 제공함. 나머지는 `ReactionGame`, `DigitSpanGame`, `StroopGame`, `PatternGame`, `VigilanceGame`으로 분리함.

- [x] **Step 4: 앱 상태 머신에 7개 활동을 승인 순서대로 연결함**

```tsx
const [step, setStep] = useState<SessionStep>({ type: 'intro' });
const [results, setResults] = useState<SessionResults>({});
const completeGame = (key: GameKey, result: GameResult) => {
  setResults(current => ({ ...current, [key]: result }));
  setStep(current => nextStep(current));
};
```

- [x] **Step 5: 모든 `setTimeout`을 effect cleanup에서 해제하고 처음으로·다시 시작은 `results={}`와 `step={type:'intro'}`로 초기화함**

- [x] **Step 6: 관련 테스트와 전체 테스트를 통과시킴**

Run: `npm test`
Expected: PASS with 0 failed tests and no React act warnings.

### Task 3: 환자용 디자인, 접근성, 개인정보 비저장 검증

**Files:**
- Create: `src/styles.css`, `src/privacy.test.ts`
- Modify: `src/components/*.tsx`, `src/games/*.tsx`, `src/App.tsx`
- Create: `design-tokens.roles.json`, `docs/design/token-report.md`

**Interfaces:**
- Consumes: 게임과 상태 머신의 접근 가능한 이름과 상태.
- Produces: 한 개의 주 행동, 44px 터치 영역, 키보드 포커스, `aria-live`, 반응형 레이아웃.

- [x] **Step 1: 저장소·쿠키·외부 전송이 없는지 검증하는 실패 테스트를 작성함**

```ts
expect(window.localStorage.length).toBe(0);
expect(window.sessionStorage.length).toBe(0);
expect(document.cookie).toBe('');
expect(globalThis.fetch).not.toHaveBeenCalled();
```

- [x] **Step 2: 테스트가 안전 설명 또는 초기화 동작 부재로 실패하는지 확인함**

Run: `npm test -- src/privacy.test.ts`
Expected: FAIL until the disclaimer and memory-only reset behavior are present.

- [x] **Step 3: `src/styles.css`에 K-Sleep 환자용 토큰과 반응형 규칙을 구현함**

```css
:root { --ks-page-bg:#FAF8F2; --ks-brand:#0059B8; --ks-ink:#0F1923; --ks-dim:#727270; }
button { min-height:44px; }
@media (min-width:768px) { .app-shell { max-width:720px; } }
```

- [x] **Step 4: 모든 버튼에 접근 가능한 이름을 주고 `:focus-visible`, `aria-live="polite"`, `prefers-reduced-motion`을 적용함**

- [x] **Step 5: 디자인 토큰 역할 파일을 생성하고 실제 CSS와 소스에 검증기를 실행함**

Run: `node ~/.claude/skills/ksleep-design/verify-design-tokens.mjs --css src/tokens.css --prefix ks --roles design-tokens.roles.json --src src --report docs/design/token-report.md`
Expected: exit 0, unreviewed tokens 0, contrast failures 0.

- [x] **Step 6: TypeScript, 테스트, 빌드를 모두 실행함**

Run: `npm run check && npm test && npm run build`
Expected: all commands exit 0.

### Task 4: Git 반영, Vercel Production, live 검증

**Files:**
- Modify: `README.md`
- Create: `.gitignore`, `vercel.json`

**Interfaces:**
- Produces: 비공개 GitHub 전용 브랜치와 공개 Production URL.

- [x] **Step 1: `src`, 설정, lockfile, README, 설계·계획 문서는 COMMIT으로 분류하고 `node_modules`, `dist`, `.vercel`, 브라우저 캡처, 로컬 절대경로가 포함된 생성 검증 리포트는 DO_NOT_COMMIT으로 분류함**

- [x] **Step 2: 정확한 파일만 stage하고 staged diff, 공백 오류, secret/PHI 의심 내용을 확인함**

Run: `git status --short && git diff --cached --name-only && git diff --cached && git diff --check`
Expected: 요청 범위 파일만 staged, 공백 오류 0, secret/PHI 0.

- [x] **Step 3: 한 목적의 로컬 commit을 만들고 전용 브랜치를 명시적으로 push함**

Run: `git push origin feat/korean-cognitive-check`
Expected: remote branch created; no direct push to `main`.

- [x] **Step 4: Vercel 프로젝트를 연결하고 Production 배포함**

Run: `vercel link --yes --project ksleep-care-cognitive-check && vercel deploy --prod --yes`
Expected: Production URL returned under the verified `urmypride-2856` account.

- [x] **Step 5: Production alias와 HTTP 응답을 확인함**

Run: `vercel inspect <deployment-url> && curl -fsS -o /dev/null -w '%{http_code}' <production-url>`
Expected: Production ready and HTTP 200.

- [x] **Step 6: Playwright CLI로 390px, 768px, 1440px와 7개 전체 완료·재시작·비저장을 확인함**

각 크기에서 snapshot 후 `document.documentElement.scrollWidth <= window.innerWidth`를 확인함. 전체 흐름에서 최신 snapshot의 역할·이름 기반 ref만 사용해 결과 제목 `오늘의 결과`와 재시작 뒤 `인지 컨디션 체크`를 확인함.

- [x] **Step 7: 마지막으로 테스트, 빌드, Git 상태, 배포, live 증거를 다시 확인함**

Run: `npm run check && npm test && npm run build && git status --short --branch`
Expected: 검사 3개 exit 0, tracked file clean, Production live verification complete.
