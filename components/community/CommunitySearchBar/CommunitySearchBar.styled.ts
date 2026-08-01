import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/**
 * 검색 폼 + 정밀 검색 트리거를 한 세트로 묶는 래퍼. 정밀 필터의 숫자 입력은 검색 `<form>` **바깥**에
 * 둔다(Enter가 텍스트-검색 submit을 트리거하지 않게).
 *
 * **한 줄 한 벌이다.** 예전에는 `variant` prop 으로 데스크톱(행)/모바일(열) 두 모양을 상호배타 렌더했는데,
 * 그건 헤더 인라인 검색과 헤더 아래 펼침 바가 **서로 다른 인스턴스**였기 때문이다. 검색이 본문 툴바로
 * 내려오면서 인스턴스는 하나가 됐고(2026-07-31), 모바일에서도 열(2줄)로 펴면 sticky 바가 화면의
 * 두 배를 먹는다 → 전 폭에서 `[기준][입력][정밀]` 한 줄을 유지하고 입력만 늘었다 줄었다 한다.
 * 좁은 폭 여유는 정밀 트리거를 아이콘 전용으로 두어 만든다(라벨은 aria-label 이 갖는다).
 */
export const SearchCluster = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
  width: 100%;
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
