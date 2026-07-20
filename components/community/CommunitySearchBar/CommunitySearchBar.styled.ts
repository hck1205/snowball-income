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

/**
 * 필터 셀렉트 자리. 셀렉트 자체는 공용 프리미티브(`@/components/common/Select`, size='md')가 그리고,
 * 이 래퍼는 flex 행에서 셀렉트가 찌그러지지 않게 잡아 두는 역할만 한다.
 */
export const FilterField = styled.div`
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
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
