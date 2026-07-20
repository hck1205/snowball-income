import type { ReactNode, SelectHTMLAttributes } from 'react';

/**
 * 셀렉트 크기. 값은 컨트롤 높이 = 레포에 실재하던 3개 높이를 그대로 흡수한 것이다.
 *  - sm(32px): 차트 헤더처럼 크롬이 촘촘한 자리(구 ProjectionYearSelect)
 *  - md(36px): 헤더 컨트롤 줄 — 같은 줄의 검색 입력(36px)과 높이를 맞춘다(구 FilterSelect)
 *  - lg(40px): 폼 필드 기본. InputField/InlineField 계열의 표준 컨트롤 높이다.
 */
export type SelectSize = 'sm' | 'md' | 'lg';

/**
 * 폭 정책.
 *  - 'full': 컨테이너 100% (폼 필드 기본)
 *  - 'auto': 내용 폭(max-content)까지만, 최대 100%
 *  - 그 외 문자열: CSS 길이를 그대로 고정 폭으로 쓴다(예: '64px')
 */
export type SelectWidth = 'full' | 'auto' | (string & {});

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'width'> & {
  children: ReactNode;
  /** 기본 'lg'(폼 필드 표준 40px). */
  size?: SelectSize;
  /** 기본 'full'. */
  width?: SelectWidth;
  /** width='auto'일 때의 하한 폭(CSS 길이). 옵션 길이에 따라 컨트롤이 튀는 걸 막는다. */
  minWidth?: string;
  /** 루트에 붙는 className — styled(Select)로 감쌀 때 필요하다. */
  className?: string;
};
