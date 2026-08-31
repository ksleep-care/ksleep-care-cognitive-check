# 한글 인지 컨디션 체크

로그인 없이 7개의 짧은 활동을 완료하고 오늘의 기억·집중·반응 상태를 확인하는 K-Sleep Care 독립 웹앱임.

## 운영 경계

- `ksleep-app`과 코드·API·DB·인증을 공유하지 않음.
- 이름, 연락처, 생년월일 등 개인정보를 입력받지 않음.
- 결과는 브라우저 메모리에만 존재하며 새로고침하면 사라짐.
- 의료 진단이나 정상·비정상 판정을 제공하지 않음.

## Production

- https://ksleep-care-cognitive-check.vercel.app

## 7개 활동

1. 이야기 기억하기
2. 반응속도
3. 숫자 뒤집기
4. 색깔 단어
5. 이야기 다시 퀴즈
6. 패턴 매칭
7. 별똥별 잡기

## 로컬 실행과 검증

```bash
npm install
npm run dev
npm run check
npm test
npm run build
```

설계와 완료 기준은 `docs/superpowers/specs/20260831_product_design_korean-cognitive-check.md`에 기록함.
