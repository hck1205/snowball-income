import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/**
 * 검색 폼 + 정밀 검색 트리거를 한 세트로 묶는 래퍼. 정밀 필터의 숫자 입력은 검색 `<form>` **바깥**에
 * 둔다(Enter가 텍스트-검색 submit을 트리거하지 않게). 반응형은 @media 대신 variant prop 분기:
 * 데스크톱(row)은 폼 옆 아이콘 트리거, 모바일(column)은 검색 input 아래 전체폭 버튼.
 */
export const SearchCluster = styled.div<{ mobile: boolean }>`
  display: flex;
  min-width: 0;
  ${({ mobile }) =>
    mobile
      ? 'flex-direction: column; align-items: stretch; gap: ' + space[2] + '; width: 100%;'
      : 'flex-direction: row; align-items: center; gap: ' + space[2] + ';'}
`;

export const SearchForm = styled.form`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
  flex: 1 1 auto;
`;

/** 셀렉트를 감싸 커스텀 화살표(lucide ChevronDown)를 겹쳐 놓는 필드. */
export const FilterField = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
`;

export const FilterSelect = styled.select`
  /* 브라우저 기본 화살표 제거 → 우측에 커스텀 chevron을 얹는다(오른쪽 패딩으로 자리 확보). */
  appearance: none;
  -webkit-appearance: none;
  height: 36px;
  padding: 0 ${space[7]} 0 ${space[3]};
  border-radius: ${radius.md};
  border: 1px solid ${color.borderStrong};
  background: ${color.surface};
  color: ${color.text};
  font-family: inherit;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  line-height: 1;
  cursor: pointer;
  transition: border-color ${motion.fast} ${motion.ease}, box-shadow ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.brandBorder};
  }

  /* 검색 입력(SearchInputWrap)과 동일한 포커스 링으로 두 컨트롤을 시각적으로 맞춘다. */
  &:focus-visible {
    outline: none;
    border-color: ${color.focusRing};
    box-shadow: 0 0 0 3px ${color.focusShadow};
  }

  /* 다크모드 등에서 옵션 팝업 대비를 확실히 한다(브라우저별 기본 대비가 약한 경우 대비). */
  option {
    color: ${color.text};
    background: ${color.surface};
  }
`;

/** 커스텀 셀렉트 화살표. 클릭이 셀렉트로 통과하도록 pointer-events는 끈다. */
export const FilterChevron = styled.span`
  position: absolute;
  right: ${space[2]};
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  color: ${color.textMuted};
  pointer-events: none;
`;

export const SearchInputWrap = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  height: 36px;
  padding: 0 ${space[3]};
  border-radius: ${radius.md};
  border: 1px solid ${color.borderStrong};
  background: ${color.surface};
  min-width: 0;
  flex: 1 1 auto;
  transition: border-color ${motion.fast} ${motion.ease}, box-shadow ${motion.fast} ${motion.ease};

  &:focus-within {
    border-color: ${color.focusRing};
    box-shadow: 0 0 0 3px ${color.focusShadow};
  }

  svg {
    color: ${color.textMuted};
    flex: 0 0 auto;
  }
`;

export const SearchInput = styled.input`
  border: 0;
  background: transparent;
  outline: none;
  min-width: 0;
  flex: 1 1 auto;
  color: ${color.text};
  font-size: ${font.size.base};

  /**
   * 포커스 링은 감싸는 SearchInputWrap(:focus-within)이 한 겹만 그린다.
   * 전역 globalStyles의 input:focus-visible(outline + box-shadow)가 입력창에도 링을 그려
   * 테두리가 이중으로 보였다 → 여기서 명시적으로 무효화한다(클래스 선택자라 전역보다 우선).
   */
  &:focus,
  &:focus-visible {
    outline: none;
    box-shadow: none;
  }

  &::placeholder {
    color: ${color.textMuted};
  }
`;
