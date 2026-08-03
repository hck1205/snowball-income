import styled from '@emotion/styled';
import { appHeaderHeight, color, font, media, radius, shadow, space, zIndex } from '@/shared/styles';

/** 회원 탈퇴 완료 등 목록 상단 1회성 안내 배너 자리. 머리 면보다 위에 선다. */
export const GalleryNotice = styled.div`
  margin-bottom: ${space[4]};
`;

/**
 * 검색 줄 — **머리 면 바로 아래의 본문 첫 줄**이고, 아래 정렬·뷰토글 줄과 따로 선다.
 *
 * 2026-07-31 사용자 지시로 앱 헤더 가운데 슬롯에서 여기로 내려왔다("같은 라인에 있으니까 이상해").
 * 아래 `FeedDeck` 에 합치지 않는 이유가 그 지시의 이유와 같다 — 한 줄에 검색·정렬·뷰토글 세
 * 덩어리를 세우면 헤더에서 벌어진 폭 경쟁이 본문에서 재현된다. 🔴 이 분리를 되돌리지 마라.
 *
 * 🔴 **반응형(≤1023)에서는 sticky** — 사용자는 "fixed"라고 했지만 `position: fixed` 는 흐름에서
 * 빠져 본문을 덮고 그만큼 상단 패딩을 손으로 벌어야 한다(그 값이 헤더 높이와 어긋나는 순간
 * 겹치거나 뜬다). sticky 는 자기 자리를 지키므로 레이아웃 시프트가 0이고 시각 결과는 같다.
 * `top` 은 **`--sb-app-header-h` 실측값**(AppHeader 가 ResizeObserver 로 발행)을 쓴다.
 *
 * ⚠ sticky 는 **컨테이닝 블록(부모) 안에서만** 움직인다. 이 요소의 부모는 갤러리 `<section>`
 * (목록 전체를 감싸는 긴 블록)이라 목록이 끝날 때까지 붙어 있다 — 부모를 짧은 줄로 바꾸거나
 * grid item 으로 만들면 그 순간 조용히 무력해진다(레포 실측 함정).
 */
export const SearchRow = styled.div`
  margin-bottom: ${space[5]};

  ${media.down('headerStack')} {
    position: sticky;
    top: ${appHeaderHeight};
    /* 콘텐츠 위·헤더(30) 아래. 명시하지 않으면 뒤따르는 카드가 이 바를 덮는다. */
    z-index: ${zIndex.stickyAction};
    margin-bottom: 0;
    padding: ${space[2]} 0;
    background: ${color.bg};
    box-shadow: 0 1px 0 ${color.border};
  }
`;

/**
 * 정렬 · 뷰 전환 줄.
 *
 * 예전에는 여기에 글쓰기 CTA 까지 세 덩어리가 서서, 좁은 폭에서 줄이 접히며 정렬 탭과
 * 버튼이 위아래로 흩어졌다. 글쓰기는 머리 면(FeedMasthead)으로 올라갔고, 이 줄은 **목록을
 * 어떻게 볼 것인가**만 다룬다 — 좌: 무엇을 먼저(정렬), 우: 어떤 밀도로(뷰).
 * 아래 헤어라인이 이 줄과 목록을 갈라 "여기부터 목록"을 형태로 말한다.
 */
export const FeedDeck = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${space[3]};
  margin-bottom: clamp(${space[4]}, 2vw, ${space[6]});
  padding-bottom: ${space[3]};
  border-bottom: 1px solid ${color.border};

  ${media.down('headerStack')} {
    padding-top: ${space[3]};
  }
`;

/**
 * 뷰 전환 세그먼트.
 *
 * 아이콘 전용이던 자리에 **낱말을 붙였다** — 격자/목록은 아이콘만으로 구분되지 않는다는 신고가
 * 반복되는 종류의 컨트롤이다. 접근명(aria-label "카드 보기")이 보이는 낱말("카드")을 포함하므로
 * WCAG 2.5.3(label in name)을 지킨다. 좁은 폭에서는 낱말을 접고 아이콘만 남긴다.
 *
 * 활성 표시는 **면색이 아니라 부상**이다(밝은 알약 + e1). 폭이 180px 아래라 색을 써도 예산에
 * 걸리지는 않지만, 같은 화면의 정렬 탭이 이미 색으로 활성을 말하고 있어 두 컨트롤이 같은 말을
 * 하면 어느 쪽이 지금 축인지 흐려진다.
 */
export const ViewToggle = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: ${radius.pill};
  border: 1px solid ${color.border};
  background: ${color.surfaceMuted};
`;

export const ViewToggleButton = styled.button<{ active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  height: 30px;
  padding: 0 ${space[3]};
  border: 0;
  border-radius: ${radius.pill};
  background: ${({ active }) => (active ? color.surface : 'transparent')};
  box-shadow: ${({ active }) => (active ? shadow.e1 : 'none')};
  color: ${({ active }) => (active ? color.brandText : color.textMuted)};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  cursor: pointer;

  &:hover {
    color: ${({ active }) => (active ? color.brandText : color.text)};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }

  svg {
    flex: 0 0 auto;
  }
`;

/** 좁은 폭에서 접히는 낱말. 접혀도 접근명은 aria-label 이 그대로 갖는다. */
export const ViewToggleLabel = styled.span`
  ${media.down('mobileWide')} {
    display: none;
  }
`;

/**
 * 목록 보기(행) 컨테이너.
 * 행이 자기 면·반경·부상을 가지므로 구분선 대신 세로 간격이 리듬을 만든다.
 * 위쪽 여유는 행의 hover 이동(-2px)이 헤어라인에 닿지 않게 하는 값이다.
 */
export const InlineList = styled.ul`
  list-style: none;
  margin: 0;
  padding: ${space[1]} 0 0;
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
`;

/** 무한스크롤 센티널. */
export const Sentinel = styled.div`
  min-height: 1px;
`;
