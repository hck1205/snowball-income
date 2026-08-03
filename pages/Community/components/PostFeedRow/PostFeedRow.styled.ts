import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import {
  PICK,
  PICK_RADIUS,
  cardElevation,
  color,
  font,
  media,
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
 * 지금: **키커 → 표제 → 리드 → (숫자 스트립)** 의 편집 조판 + **우측 계수 레일**.
 * - 키커(분류 배지·작성자·시간)가 제목 **위**로 올라가 가장 가벼운 줄이 된다.
 * - 표제는 카드 제목과 같은 `pickTitleFontSize`(16~20px)로 올라가 행의 유일한 앵커가 된다.
 * - 조회·댓글·좋아요는 텍스트 체인에서 빠져나와 **세로 계수 레일**로 우측에 선다
 *   (세로 헤어라인 + 우측정렬 + tabular). 숫자끼리 열이 맞아 행 사이 비교가 된다.
 *
 * 재질(반경·부상)은 카드와 공유한다 — 갤러리 우상단 토글이 이 둘을 왕복하므로 "같은 앱의
 * 두 밀도"로 읽혀야 한다. **밀도(패딩·글자 크기)만 나눈다.**
 */
export const RowLink = styled(Link)`
  ${cardElevation('pick')}
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: clamp(${space[4]}, 2.4vw, ${space[7]});
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

  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr);
    gap: ${space[3]};
  }
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

/** 리드(description) — 68ch 로 잰다. 게시판은 숫자 칩이 없어 행 전폭 1,130px 까지 늘어난다. */
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
  transition: background ${motion.base} ${motion.ease};

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

  a:hover & {
    background: ${color.surfaceMuted};
  }

  a:hover &::before {
    width: 6px;
  }
`;

/**
 * 우측 계수 레일 — 세로 헤어라인으로 본문과 갈린다.
 * 좁은 폭에서는 아래로 떨어져 가로 줄이 되고, 공유 버튼만 오른쪽 끝으로 밀린다.
 */
export const RowStatRail = styled.div`
  display: grid;
  justify-items: end;
  align-content: start;
  gap: ${space[2]};
  flex: 0 0 auto;
  padding-left: clamp(${space[4]}, 2vw, ${space[6]});
  border-left: 1px solid ${color.border};

  ${media.down('mobileWide')} {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: ${space[4]};
    padding: ${space[3]} 0 0;
    border-left: 0;
    border-top: 1px solid ${color.border};
  }
`;

export const RowStatCell = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${space[1]};
  min-width: 52px;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  ${font.numeric}

  svg {
    flex: 0 0 auto;
    opacity: 0.8;
  }

  ${media.down('mobileWide')} {
    min-width: 0;
  }
`;

export const RowStatValue = styled.span`
  color: ${color.textSecondary};
  font-weight: ${font.weight.semibold};
`;

/** 공유 버튼 자리 — 계수 레일 맨 아래(좁은 폭에서는 줄 오른쪽 끝). */
export const RowShareSlot = styled.span`
  display: inline-flex;
  margin-top: ${space[1]};

  ${media.down('mobileWide')} {
    margin: 0 0 0 auto;
  }
`;
