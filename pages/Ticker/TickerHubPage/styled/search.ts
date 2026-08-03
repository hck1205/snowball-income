import styled from '@emotion/styled';
import { color, font, iconOpticalAlign, motion, radius, space } from '@/shared/styles';

/* ── 검색 ─────────────────────────────────────────────────────────────────── */

/**
 * 검색 필드.
 *
 * 🔴 이 화면에 종전에 **없던 기능**이다. 검색 유입자는 특정 티커(SCHD·JEPI)를 들고 들어오는데,
 * 종전에는 그 티커가 목록에 있는지 확인할 방법이 30장을 눈으로 훑는 것뿐이었다.
 *
 * 면은 중립(`surfaceMuted`)이다 — 폭이 레일 전체(약 232px)라 채도를 깔면 tintscan 의 3번째 면이 된다.
 */
export const SearchField = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${space[2]};
  padding: 0 ${space[2]} 0 ${space[3]};
  border-radius: ${radius.pill};
  background: ${color.surfaceMuted};
  border: 1px solid ${color.border};
  transition: border-color ${motion.fast} ${motion.ease};

  &:focus-within {
    border-color: ${color.brand};
  }
`;

export const SearchGlyph = styled.span`
  ${iconOpticalAlign('sans', font.size.base)}
  display: inline-flex;
  flex: 0 0 auto;
  color: ${color.textMuted};
`;

/**
 * 🔴 `width: 0` + `flex: 1 1 0` 이 핵심이다. `input` 은 `size` 속성 기본값(20자)에서 오는 고유 폭을
 * 갖고, 크롬은 flex 컨테이너의 min-content 를 자식의 **flex base size** 로 잡는다 — `min-width: 0`
 * 만으로는 부족해서 검색 필드의 min-content 가 239px 이 됐고, 264px 레일 안의 auto 트랙이 그만큼
 * 부풀어 레일 전체가 273px 로 넘쳤다(실측 2026-08-03: 개수·보기 전환이 잘려 나갔다).
 */
export const SearchInput = styled.input`
  flex: 1 1 0;
  width: 0;
  min-width: 0;
  padding: 9px 0;
  border: none;
  background: none;
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};

  &::placeholder {
    color: ${color.textMuted};
    font-weight: ${font.weight.regular};
  }

  /* 브라우저 기본 지우기 버튼(Edge/Chrome)은 우리 버튼과 겹치므로 숨긴다. */
  &::-webkit-search-cancel-button {
    display: none;
  }
`;

/** 검색어가 있을 때만 서는 지우기 버튼. 없을 때 자리를 비워 두지 않는다(빈 아이콘 자리는 노이즈다). */
export const SearchClear = styled.button`
  flex: 0 0 auto;
  display: inline-grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: ${radius.pill};
  background: none;
  color: ${color.textMuted};
  cursor: pointer;
  transition: background ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
    color: ${color.text};
  }
`;
