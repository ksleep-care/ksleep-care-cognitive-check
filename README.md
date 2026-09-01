# 한글 인지 컨디션 체크

로그인 없이 오늘의 인지 컨디션을 스스로 확인하는 K-Sleep Care 독립 웹앱.

게임 7개로 워밍업하고, **3분 집중 측정**을 반복해 내 기준선과 비교한다.

## Production

- https://ksleep-care-cognitive-check.vercel.app

## 운영 경계

- `ksleep-app`과 코드·API·DB·인증·쿠키를 공유하지 않는다.
- 이름·연락처·생년월일·환자번호 같은 개인정보를 입력받지 않는다.
- **의료 진단이나 정상·비정상 판정을 제공하지 않는다.** 연령별 규준이 없으므로
  또래 평균, 백분위, ADHD 점수를 만들지 않는다.
- 실제 환자정보(PHI)는 이 앱에 들어오지 않는다.

## 화면

하단 탭 4개다. K-Sleep 앱의 `홈·리포트·기록·챗봇·수면팁`을 복사하지 않는다.

| 탭 | 담는 것 |
|---|---|
| 홈 | 오늘 할 한 가지(3분 측정) + 기준선 진행 |
| 플레이 | 레벨 1~4, 게임 7개 세션, 별도 3분 측정 |
| 나의 변화 | 저장 동의, 기준선 진행, 최근 기록, 모두 삭제 |
| 게임 안내 | 각 과제가 무엇을 보는지와 한계 |

## 게임 7개

| # | 이름 | 난이도 적용 |
|---|---|---|
| 1 | 이야기 기억하기 | O |
| 2 | 반응속도 | X (고정) |
| 3 | 숫자 뒤집기 | O |
| 4 | 색깔 단어 | O |
| 5 | 이야기 다시 퀴즈 | O |
| 6 | 패턴 매칭 | O |
| 7 | 별똥별 잡기 | X (고정) |

문제마다 즉시 `맞았어요` / `아쉬워요`와 정답·한 줄 설명을 준다.
**점수는 최초 제출로만 확정된다.** 정답을 본 뒤 다시 눌러도 점수가 바뀌지 않는다.

## 3분 집중 측정 (PVT)

레벨과 무관하게 **항상 똑같이** 진행되는 별도 측정이다. 기준선을 만들 수 있는 건 이것뿐이다.

측정 계약의 정본은 `src/domain/pvt.ts` 상수 하나다. 근거 논문:
[Basner 2011, Acta Astronautica 69:949–959](https://pubmed.ncbi.nlm.nih.gov/22025811/).

**논문과 다른 점**: 논문은 전용 측정기기(PVT-192)를 썼고 이 앱은 브라우저다.
화면·입력 지연이 달라서 **절대 ms를 논문 수치와 직접 비교하지 않는다.**
`355ms`는 lapse를 세는 규칙으로만 쓰며, 10분 PVT의 `500ms` 기준과 섞지 않는다
([근거](https://pubmed.ncbi.nlm.nih.gov/35242006/)).

측정 품질이 나쁘면(자극 부족·탭 이탈·false start 과다·타이머 밀림)
`다시 측정 권장`으로 표시하고 **기준선에 넣지 않는다.**

## 저장 — 기본은 꺼짐

동의하기 전에는 브라우저 영구 저장소가 **비어 있다.** 서버로 아무것도 보내지 않는다.

`이 기기에 나의 변화 저장`을 켜면 3분 측정의 요약값만 이 브라우저의 `localStorage`에 남는다.

**저장하는 것 (정확히 6개)**

```
protocol, completedAt, medianRtMs, lapses, falseStarts, performanceScore
```

**저장하지 않는 것**

이름, 연락처, 생년월일, 환자번호, 진단명, 치료순응도, 이야기 답안, 숫자 입력값, 전체 raw trial.

schema 테스트가 그 외 필드를 전부 잘라낸다. `나의 변화` 탭에서 `내 기록 모두 삭제`로 즉시 지운다.

⚠️ 이 기기에만 저장된다. 같은 기기를 쓰는 다른 사람도 이 기록을 볼 수 있다.

## 로컬 실행과 검증

```bash
npm install
npm run dev
npm run check && npm test && npm run build
```

디자인 토큰 대비 검증 (수치는 리포트 파일에만 존재한다):

```bash
node ~/.claude/skills/ksleep-design/verify-design-tokens.mjs \
  --css src/tokens.css --prefix g --roles design-tokens.roles.json \
  --src src --report docs/design/token-report.md
```

## 문서

- 디자인 방향: `DESIGN.md`
- 설계와 완료 기준: `docs/superpowers/specs/20260831_product_design_korean-cognitive-check.md`
- 구현 계획: `docs/superpowers/plans/20260831_product_plan_korean-cognitive-check.md`
- 대비 검증 리포트: `docs/design/token-report.md`
