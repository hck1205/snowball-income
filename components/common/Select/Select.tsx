import { ChevronDown } from 'lucide-react';
import type { SelectProps, SelectSize } from './Select.types';
import { SelectChevron, SelectRoot, StyledSelect } from './Select.styled';

const ICON_SIZE: Record<SelectSize, number> = { sm: 14, md: 16, lg: 16 };

/**
 * 공용 셀렉트 프리미티브.
 *
 * **네이티브 `<select>`를 유지한다** — 모바일 OS 휠 UI, 키보드 조작, 스크린리더 지원이 공짜다.
 * 커스텀 팝오버로 대체하지 마라.
 *
 * 이 컴포넌트가 생기기 전에는 `styled.select`가 5곳에 각각 정의돼 있었고 높이·테두리·화살표가
 * 전부 달랐다. 크기 차이는 `size`, 폭 차이는 `width`/`minWidth`로 흡수하고 화살표는 여기 한 곳에서만 그린다.
 *
 * 포커스 링은 전역 스타일(globalStyles의 `select:focus-visible`)에 맡긴다 — 여기서 덮으면
 * 앱 전체의 포커스 표현이 셀렉트만 어긋난다.
 */
export default function Select({ size = 'lg', width = 'full', minWidth, className, children, ...rest }: SelectProps) {
  return (
    <SelectRoot widthMode={width} minWidthValue={minWidth} className={className}>
      <StyledSelect sizeVariant={size} {...rest}>
        {children}
      </StyledSelect>
      <SelectChevron sizeVariant={size} aria-hidden="true">
        <ChevronDown size={ICON_SIZE[size]} strokeWidth={1.8} />
      </SelectChevron>
    </SelectRoot>
  );
}
