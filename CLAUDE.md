# 인지 컨디션 체크 (ksleep-care-cognitive-check)

로그인 없이 오늘의 인지 컨디션을 확인하는 K-Sleep Care **독립 웹앱**.

- Production: https://ksleep-care-cognitive-check.vercel.app
- 저장소: `Sylvie0810/ksleep-care-cognitive-check` (private)
- 스택: React 19 + TypeScript + Vite + Vitest, Vercel 정적 배포

## 이 저장소의 경계

- `ksleep-app`(CareLoop·SOOMi)과 코드·API·DB·인증·쿠키를 **공유하지 않는다.**
- **실제 환자정보(PHI)를 다루지 않는다.** 이름·연락처·생년월일·환자번호를 입력받지도, 저장하지도 않는다.
- 백엔드가 없다. 외부 API 호출 라이브러리를 추가하지 않는다.
- 이 저장소에 `ksleep-app`의 무거운 하네스(Plan Ledger, 승인 게이트)를 복사하지 않는다.

## 절대 하지 않는 것 — 의료 안전 경계

이 앱은 진단 도구가 아니다. 아래를 만들면 포지셔닝 위반이자 규제 위험이다.

- 진단명, 질환 위험도, 정상·비정상 판정, ADHD 선별 점수
- 연령별·성별 백분위, "또래 평균" 비교 — **검증된 한국 성인 규준이 없다**
- 치료 효과 주장, 진료 권고
- `작업기억 정상` 같은 표현. `작업기억을 활용하는 게임`이라고 쓴다.

결과 화면은 항상 **무엇을 본 과제 / 이번 값 / 읽는 방향 / 비교 범위 / 한계** 5가지를 함께 준다.

## 3분 PVT 측정 계약 — 손대기 전에 읽는다

**정본은 `src/domain/pvt.ts`의 상수 하나다.** 문서와 코드에 값을 두 번 적지 않는다.

논문 원문의 Material and methods를 직접 확인한 값이다
(Basner 2011, Acta Astronautica 69:949–959, https://pubmed.ncbi.nlm.nih.gov/22025811/).

- 측정 3분 · 자극 간격 2~4초 · 100ms 미만 false start · 30초 무응답 lapse
- lapse 기준 **≥ 355ms**. **10분 PVT의 500ms와 코드·문구·테스트 어디에서도 섞지 않는다.**

논문은 전용 측정기기(PVT-192)를 썼고 이 앱은 브라우저다. 화면·입력 지연이 다르므로
**절대 반응시간을 논문 수치와 직접 비교하지 않는다.** 355ms는 lapse를 세는 규칙으로만 쓴다.
이 한계 문구를 화면에서 지우지 않는다.

`레벨은 3분 PVT에 절대 영향을 주지 않는다.` 레벨이 바꾸는 것은 `src/domain/levels.ts`뿐이다.

## 저장 경계

기본은 **꺼짐**. 동의 전에는 브라우저 영구 저장소가 비어 있어야 한다.

동의 후 저장 허용 필드는 정확히 6개다:
`protocol`, `completedAt`, `medianRtMs`, `lapses`, `falseStarts`, `performanceScore`.

`src/domain/baseline.ts`의 `sanitizeEntry`가 그 외 필드를 전부 잘라내고,
`src/privacy.test.tsx`가 이를 지킨다. 필드를 추가하려면 두 곳을 함께 바꾸고 이유를 남긴다.

서버 전송·계정·쿠키·외부 analytics는 없다. `내 기록 모두 삭제`를 항상 제공한다.

## 디자인

- 방향 정본: `DESIGN.md`
- 색 값 정본: `src/tokens.css` (게임 전용 어두운 팔레트, prefix `--g-`)
- **대비 수치를 손으로 적지 않는다.** 검증기를 돌리고 리포트 파일만 참조한다:

```bash
node ~/.claude/skills/ksleep-design/verify-design-tokens.mjs \
  --css src/tokens.css --prefix g --roles design-tokens.roles.json \
  --src src --report docs/design/token-report.md
```

- **PVT 측정 화면에는 3D tilt·particle·parallax·spring 이동·동적 배경을 넣지 않는다.**
  타깃 위치·크기·표시 방식이 고정돼야 반응시간이 오염되지 않는다. `.is-measuring`이 배경까지 정지시킨다.
- 브라우저 기본 `alert`/`confirm`을 쓰지 않는다. 앱 안에서 묻는다.
- 한글 본문에 `word-break: keep-all`. 터치 영역 44px 이상. 색만으로 상태를 표현하지 않는다.

## 작업 규칙

```bash
npm install
npm run dev
npm run check && npm test && npm run build   # 셋 다 exit 0 이어야 함
```

- 도메인 계산과 저장 schema는 **실패 테스트부터** 쓴다.
- `main`이 정본이다. 변경은 전용 branch에서 하고 PR로 합친다.
- `git add <정확한 경로>`만 쓴다. `git add .`, `git add -A`, `git commit -a`는 금지.
- 배포는 `vercel deploy --prod --yes`. 로컬 통과만으로 완료라고 하지 않는다 —
  Production HTTP 200과 실제 브라우저 확인까지가 완료다.

## 문서

- `DESIGN.md` — 색·깊이·모션·측정 화면 비장식 구간
- `docs/superpowers/specs/20260831_product_design_korean-cognitive-check.md` — 설계와 완료 기준
- `docs/superpowers/plans/20260831_product_plan_korean-cognitive-check.md` — 구현 계획
