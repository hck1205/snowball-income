import type { TabsProps } from './Tabs.types';
import { TabButton, TabList } from './Tabs.styled';

/**
 * 탭 목록.
 *
 * `role="tab"` / `aria-selected`는 그대로 유지한다 — 앱 테스트가 `getByRole('tab', { name })`으로
 * 티커 모달의 프리셋/입력 탭을 잡는다.
 *
 * 패널(`role="tabpanel"`)은 여기서 렌더하지 않는다. 호출부마다 패널 구조가 달라서
 * 억지로 묶으면 오히려 제약이 된다.
 */
export default function Tabs({ items, activeId, onChange, ariaLabel }: TabsProps) {
  return (
    <TabList role="tablist" aria-label={ariaLabel}>
      {items.map((item) => (
        <TabButton
          key={item.id}
          type="button"
          role="tab"
          active={item.id === activeId}
          aria-selected={item.id === activeId}
          disabled={item.disabled}
          onClick={() => onChange(item.id)}
        >
          {item.icon}
          {item.label}
        </TabButton>
      ))}
    </TabList>
  );
}
