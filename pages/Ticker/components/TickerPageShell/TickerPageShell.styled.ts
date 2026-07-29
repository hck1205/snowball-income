import styled from '@emotion/styled';
import { color } from '@/shared/styles';

/**
 * 셸 루트. 헤더는 공용 `AppHeader`(자체 sticky·글래스)가 소유하므로 여기서는 세로 스택과 본문 폭만 정한다.
 *
 * 🔴 구 `--tk-header-h`(헤더 높이 하드코딩)는 삭제했다. 헤더 구성이 바뀔 때마다 56 → 80 → 88px 로
 * 세 번 고쳐졌고 그때마다 목차 바가 헤더와 어긋나거나 두 번째 줄이 잘렸다. 이제 `AppHeader` 가
 * 자기 높이를 실측해 `--sb-app-header-h` 로 발행한다(`shared/styles` 의 `appHeaderHeight`).
 */
export const ShellRoot = styled.div`
  min-height: 100%;
  display: flex;
  flex-direction: column;
  color: ${color.text};
`;

export const ShellMain = styled.main`
  flex: 1 1 auto;
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: clamp(20px, 4vw, 48px) clamp(16px, 4vw, 40px) 64px;
`;
