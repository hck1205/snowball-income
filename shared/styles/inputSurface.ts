import { color, font, motion, radius, space } from './tokens';

/**
 * **입력칸의 면** — 한 줄 텍스트 입력이 공유하는 css 조각.
 *
 * ## 왜 shared 로 올라왔나 (2026-08-08)
 *
 * 원래 `LedgerFormModal.styled.ts` 안의 `const inputSurface` 였다. 검색되는 제안 입력
 * (`components/common/ComboBox`)을 만들면서 **같은 폼 안에 나란히 서는 두 입력**이 서로 다른
 * 파일의 스타일을 쓰게 됐고, 그러면 한쪽만 고쳐지는 순간 높이·테두리·포커스링이 갈린다.
 * 같은 줄에 서는 컨트롤끼리 면이 다르면 눈에 바로 보이는 결함이라 조각을 공유한다.
 *
 * ⚠ 이것은 **면만** 정한다 — 폭·격자 배치는 쓰는 쪽이 정한다.
 * 🔴 높이 44px 은 터치 목표 최소치다. 줄이지 마라.
 */
export const inputSurface = `
  width: 100%;
  min-width: 0;
  height: 44px;
  padding: 0 ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  color: ${color.text};
  font-family: inherit;
  font-size: ${font.size.base};
  transition: border-color ${motion.fast} ${motion.ease};

  &::placeholder {
    color: ${color.textMuted};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }

  &[aria-invalid='true'] {
    border-color: ${color.danger};
  }
`;
