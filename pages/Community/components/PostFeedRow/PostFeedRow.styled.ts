import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import {
  PICK,
  PICK_RADIUS,
  cardElevation,
  color,
  font,
  hitAreaWithin,
  motion,
  nestedRadius,
  pickLift,
  pickTitleFontSize,
  radius,
  space
} from '@/shared/styles';

/**
 * 목록 행 — 게시판 본문과 갤러리 "목록 보기"가 같은 행을 쓴다.
 *
 * ## 예전 행에서 바꾼 것 (구조)
 * 예전: `[배지 제목] / 요약 / 작성자·시간·댓글·조회·♥ + 공유` 한 덩어리 + 우측 숫자 칩.
 * 메타가 제목 **아래**에 긴 텍스트 체인으로 붙어 있어, 훑을 때 눈이 제목·요약·메타를 거의
 * 같은 무게로 읽었다(제목 16px / 요약 13px / 메타 12px — 대비가 3~4px 뿐이었다).
 *
 * 지금: **머리줄(키커 + 공유) → 표제 → 리드 → (숫자 스트립) → 계수 줄**.
 * - 키커(분류 배지·작성자·시간)가 제목 **위**로 올라가 가장 가벼운 줄이 된다.
 * - 표제는 카드 제목과 같은 `pickTitleFontSize`(16~20px)로 올라가 행의 유일한 앵커가 된다.
 * - 조회·댓글·좋아요는 **카드 바닥 전폭 줄**로 내려가 헤어라인 아래에서 space-between 으로 선다.
 *
 * ## 🔴 2026-08-04 조판 변경 (사용자 지시)
 * 예전에는 2열 그리드(본문 | 세로 계수 레일)였고 공유 버튼이 그 레일 맨 아래에 있었다.
 * 지시는 ①계수를 더 크게 ②space-between + 양옆 패딩 ③공유는 그 줄에서 빼서 **카드 윗부분 맨
 * 우측**으로. ②는 계수 줄이 카드 폭을 전부 써야 성립하므로 2열 그리드를 유지할 수 없다 →
 * 세로 스택으로 바꿨다.
 * ⚠ 공유를 `position: absolute` 로 우상단에 띄우지 않은 이유: 레일이 사라지면서 제목 폭이
 *   1,005 → 1,110px 로 넓어지는데 제목에는 측정 폭이 없어(2줄 clamp) 긴 제목이 버튼 **밑으로**
 *   흐른다. 키커와 같은 줄에 in-flow 로 앉히면 겹칠 수가 없다.
 * ⚠ 좁은 폭 전용 분기(`media.down('mobileWide')`)도 함께 지웠다 — 이제 전 폭에서 한 가지 조판이다.
 *
 * 재질(반경·부상)은 카드와 공유한다 — 갤러리 우상단 토글이 이 둘을 왕복하므로 "같은 앱의
 * 두 밀도"로 읽혀야 한다. **밀도(패딩·글자 크기)만 나눈다.**
 */
export const RowLink = styled(Link)`
  ${cardElevation('pick')}
  position: relative;
  display: flex;
  flex-direction: column;
  gap: ${space[2]};
  border-radius: ${PICK_RADIUS};
  padding: ${PICK.pad} clamp(${space[5]}, 2vw, ${space[6]});
  --sb-inner-radius: ${radius.md};
  color: inherit;
  text-decoration: none;
  transition:
    border-color ${motion.fast} ${motion.ease},
    box-shadow ${motion.fast} ${motion.ease},
    transform ${motion.fast} ${motion.ease};

  &:hover {
    ${pickLift}
  }

  &:focus-within {
    ${pickLift}
  }
`;

/**
 * 머리줄 — 왼쪽 키커, 오른쪽 공유. 2열 그리드(`minmax(0,1fr) auto`)라 키커가 아무리 길어도
 * 공유 버튼 자리를 먹지 않고, 공유는 항상 카드 **오른쪽 끝**에 선다.
 */
export const RowHead = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  column-gap: ${space[3]};
  min-width: 0;
`;

export const RowMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[2]};
  min-width: 0;
`;

/** 표제 위의 가장 가벼운 줄 — 분류·시뮬 배지 + 작성자 · 시간. */
export const RowKicker = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[2]};
  min-width: 0;
`;

export const RowKickerMeta = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  min-width: 0;
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  ${font.numeric}

  b {
    color: ${color.textSecondary};
    font-weight: ${font.weight.semibold};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  time {
    color: inherit;
  }
`;

export const RowKickerDot = styled.span`
  color: ${color.border};
`;

/**
 * 분류 배지(게시판, 기본값 '자유' 제외). 라벨 텍스트를 반드시 동반해 색 단독 채널을 피한다.
 * 공지(emphasis)만 브랜드 틴트로 한 단계 올린다. 폭이 180px 을 넘지 않아 색면 예산 밖이다.
 */
export const RowCategoryBadge = styled.span<{ $emphasis?: boolean }>`
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  background: ${({ $emphasis }) => ($emphasis ? color.brandSubtle : color.accentAltSubtle)};
  border: 1px solid ${({ $emphasis }) => ($emphasis ? color.brandBorder : color.accentAltBorder)};
  color: ${({ $emphasis }) => ($emphasis ? color.brandText : color.accentAltText)};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
`;

/**
 * 표제 — 행의 유일한 가로 앵커. 카드 제목과 같은 스케일을 쓴다.
 * 측정 폭(max-width)을 걸지 않는 이유: 제목까지 자르면 넓은 화면에서 행 오른쪽 절반이
 * 통째로 비어 보인다(1,280px 게시판 실측). 자르는 것은 리드뿐이다.
 */
export const RowTitle = styled.h3`
  margin: 0;
  min-width: 0;
  color: ${color.text};
  font-size: ${pickTitleFontSize};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.snug};
  letter-spacing: -0.02em;
  word-break: keep-all;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/** 리드(description) — 68ch 로 잰다. 계수 레일이 바닥으로 내려간 뒤 본문 폭은 1,110px 다(1,280 실측). */
export const RowSummary = styled.p`
  margin: 0;
  min-width: 0;
  max-width: 68ch;
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: ${font.leading.normal};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/**
 * 숫자 스트립 — 우측 칩에서 **본문 아래 전폭 스트립**으로 옮겼다.
 * 우측 칩은 계수 레일과 자리를 다퉈 행 오른쪽이 두 겹 숫자로 붐볐다. 숫자의 성격도 다르다:
 * 계수(조회·댓글·♥)는 이 글의 반응이고, 시뮬 숫자는 이 글의 내용이다.
 * 읽는 면(data)이므로 중립 sunken + 좌측 4px 오로라 귀(L1)만 갖는다.
 */
export const RowSimStrip = styled.div`
  position: relative;
  /* 내용 폭까지만 — 전폭으로 늘리면 1,280px 에서 오른쪽 6할이 빈 회색 띠가 된다(실측). */
  align-self: flex-start;
  min-width: min(100%, 260px);
  max-width: 100%;
  margin-top: ${space[1]};
  padding: ${space[3]} ${space[4]} ${space[3]} ${space[5]};
  border-radius: ${nestedRadius(radius.md)};
  background: ${color.surfaceSunken};

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: ${space[3]};
    bottom: ${space[3]};
    width: 4px;
    border-radius: ${radius.pill};
    background: ${color.gradientAurora};
    transition: width ${motion.base} ${motion.ease};
  }

  /*
   * hover 의 수단은 **귀 두께 하나**다(행 자신은 pickLift 로 뜬다).
   * 🔴 2026-08-03: 여기 있던 hover 면색(surfaceMuted)을 지웠다 — 행이 흰 면이 된 뒤 muted 는
   *   그 위에서 1.04:1 이라 hover 하는 순간 숫자 스트립이 행에 녹아 사라졌다.
   *   갤러리 카드(PostGalleryCard.SimTile)와 같은 판단이다 — 두 밀도가 같은 앱으로 읽혀야 한다.
   */
  a:hover &::before {
    width: 6px;
  }
`;

/**
 * 계수 줄 — 카드 **바닥 전폭**. 가로 헤어라인 아래에서 조회·댓글·좋아요가 `space-between` 으로 선다
 * (사용자 지시: "더 크게 · space-between · 양옆 패딩"). 갤러리 카드의 `MetaStrip` 과 같은 언어라
 * 두 밀도가 한 앱으로 읽힌다.
 *
 * ⚠ 1,280px 에서 카드 폭이 1,160px 라 세 항목 사이가 400px 넘게 벌어진다. 그래도 흩어져 보이지
 *   않는 이유는 **헤어라인이 이 줄을 하나의 띠로 묶기 때문**이다 — border-top 을 지우지 마라.
 */
/**
 * 계수 줄 — 조회·댓글·좋아요를 **카드 좌측 하단**에 모은다(2026-08-04 사용자 지시).
 *
 * 🔴 `space-between` 을 되돌리지 마라. 셋을 전폭에 흩어 놓으면 숫자 사이 간격이 카드 폭을 따라
 * 널뛰어(1160px 에서 약 520px, 390px 에서 약 90px) "세 값이 한 묶음"으로 안 읽힌다.
 * 왼쪽에 붙이면 간격이 고정되고 시선이 한 번에 훑는다.
 *
 * ⚠ 공유 버튼은 여기 없다 — 목록에서 아예 뺐다(상세에만 둔다). 목록 행의 행동은 "열어 보기"
 *   하나여야 하고, 링크 안에 다른 동작이 섞이면 어디를 눌러야 할지 매번 판단해야 한다.
 */
export const RowStatRail = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[5]};
  width: 100%;
  margin-top: ${space[1]};
  padding: ${space[3]} ${space[4]} 0;
  border-top: 1px solid ${color.border};
`;

export const RowStatCell = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  color: ${color.textMuted};
  /* 12 → 14px. 아이콘도 12 → 16 으로 함께 올려야 글자와 그림의 무게가 맞는다. */
  font-size: ${font.size.base};
  ${font.numeric}

  svg {
    flex: 0 0 auto;
    opacity: 0.8;
  }
`;

export const RowStatValue = styled.span`
  color: ${color.textSecondary};
  font-weight: ${font.weight.semibold};
`;

/**
 * 공유 버튼 자리 — **카드 윗줄 맨 오른쪽**(머리줄 2열 중 오른쪽 칸).
 *
 * 버튼 자체는 32px 아이콘 버튼(`components/community/PostShareButton`)이라 그대로는 손가락에
 * 작다. 여기서 `hitAreaWithin` 으로 **히트 영역만** 44px 로 넓힌다(min(44, 32+12)=44) — 형제
 * 간격(머리줄 column-gap 12px)을 넘지 않아 키커 텍스트를 덮지 않고, 옆에 다른 누를 것도 없다.
 * 🔴 버튼의 시각 크기를 이 파일에서 키우지 마라 — 그 부품은 갤러리 카드·상세와 공유라 여기서
 *   덮으면 세 표면이 서로 다른 크기가 된다.
 */
export const RowShareSlot = styled.span`
  display: inline-flex;
  margin-right: ${space[1]};

  > button {
    ${hitAreaWithin(space[3])}
  }
`;
