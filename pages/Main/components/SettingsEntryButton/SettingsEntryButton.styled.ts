import styled from '@emotion/styled';
import { Button } from '@/components/common';
import { color } from '@/shared/styles';

/**
 * 설정 진입 버튼.
 *
 * 🔴 **열려 있을 때 숨기지 않는다.** 예전 토글은 `&[aria-expanded='true'] { display: none; }` 이었는데,
 * 그러면 ①드로어를 닫을 때 포커스를 돌려줄 대상이 DOM 에서 사라지고 ②전 폭 상시 드로어에서
 * "지금 열려 있음"을 표시할 앵커가 없어진다. 대신 **눌린 상태**를 면색+테두리 2중으로 말한다
 * (색 하나로만 상태를 전달하지 않는다).
 */
export const SettingsEntry = styled(Button)`
  &[aria-expanded='true'] {
    background: ${color.brandSubtle};
    border-color: ${color.brandBorder};
    color: ${color.brandText};
  }
`;
