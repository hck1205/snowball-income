# PR Title
feat: bootstrap Snowball Income MVP with Cursor rules architecture

# PR Body
## Summary
- `.cursor/rules` 기준으로 프로젝트 구조를 전면 재구성했습니다.
- 고정 스택(Vite, React+TS, React Router, Emotion, Jotai)으로 MVP를 구현했습니다.
- 단일 티커 배당 시뮬레이션(월 단위 계산 + 연도 집계), 입력/결과 UI, 테스트를 포함합니다.

## Key Changes
- 루트 구조 정렬: `components/`, `features/`, `pages/`, `public/`, `shared/`
- 폴더별 `index.ts` 강제 규칙 반영
- `features/YieldArchitect` 구현
  - 시뮬레이션 엔진(배당 주기/세율/재투자/목표 배당 도달 연도)
  - Jotai atom/selectors/hooks
  - Feature UI + Emotion 스타일
- 재사용 컴포넌트 추가
  - `Card`, `FormSection`, `InputField`, `ToggleField`, `DataTable`
  - 각 컴포넌트 규칙형 파일 세트 구성
- 라우팅 구성
  - `pages/Home` + `main.tsx` Router 설정
- 테스트 추가
  - 컴포넌트 테스트 + feature 사용자 시나리오 테스트

## Verification
- `npm run test` 통과
- `npm run build` 통과

## Notes
- 빌드 시 번들 크기 경고가 있으나 MVP 동작에는 영향 없습니다.
