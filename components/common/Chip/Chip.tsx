import type { ChipProps } from './Chip.types';
import { ChipButton, ChipLabel, ChipRemove, ChipRoot } from './Chip.styled';

/**
 * 티커/프리셋 칩.
 *
 * 세 가지로 쓰인다:
 *  - 장식용:   <Chip>SCHD</Chip>                       → <span>
 *  - 선택형:   <Chip onClick selected>SCHD</Chip>       → <button>
 *  - 제거형:   <Chip onRemove>SCHD</Chip>               → 라벨 + 별도 × 버튼
 *
 * 제거 버튼을 칩 본체 `<button>` 안에 중첩하지 않는다 — 버튼 안의 버튼은 유효하지 않은 HTML이고
 * 접근성 트리가 깨진다. 그래서 onClick과 onRemove가 같이 오면 바깥은 span으로 감싼다.
 */
export default function Chip({
  children,
  selected,
  disabled,
  onClick,
  onRemove,
  removeAriaLabel,
  title
}: ChipProps) {
  const removeButton = onRemove ? (
    <ChipRemove
      type="button"
      aria-label={removeAriaLabel ?? `${String(children)} 제거`}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onRemove();
      }}
    >
      ×
    </ChipRemove>
  ) : null;

  // 클릭 가능 + 제거 가능: 바깥을 span으로 두고 안에 버튼 두 개를 나란히 둔다.
  if (onClick && onRemove) {
    return (
      <ChipRoot selected={selected} disabled={disabled} title={title}>
        <ChipButton
          type="button"
          selected={selected}
          disabled={disabled}
          onClick={onClick}
          // 바깥 ChipRoot가 이미 칩의 껍데기라 안쪽 버튼의 테두리는 지운다.
          style={{ border: 0, background: 'transparent', padding: 0 }}
        >
          <ChipLabel>{children}</ChipLabel>
        </ChipButton>
        {removeButton}
      </ChipRoot>
    );
  }

  if (onClick) {
    return (
      <ChipButton type="button" selected={selected} disabled={disabled} onClick={onClick} title={title}>
        <ChipLabel>{children}</ChipLabel>
      </ChipButton>
    );
  }

  return (
    <ChipRoot selected={selected} disabled={disabled} title={title}>
      <ChipLabel>{children}</ChipLabel>
      {removeButton}
    </ChipRoot>
  );
}
