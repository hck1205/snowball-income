import styled from '@emotion/styled';
import { PickCard } from '@/components/common';
import { color, font, motion, nestedRadius, radius, space } from '@/shared/styles';

/**
 * 격자에서 **푸터 선이 맞는 카드**.
 *
 * 격자 항목은 같은 줄에서 높이가 같아지는데(실측 476px 6장 동일), 카드 안의 내용은 제목 줄 수·
 * 요약 유무로 제각각이라 계수 줄이 카드 중간에 뜬 채 남는다(실측: 바닥까지 19 / 44 / 69px).
 * 격자에서 푸터 높이가 들쭉날쭉한 것은 눈에 가장 먼저 띄는 흐트러짐이다.
 *
 * 그래서 **마지막 슬롯(액션 줄)이 남는 높이를 밀어낸다.** `PickCard` 는 자기 슬롯 순서를
 * 계약으로 갖고 있고(캡 → 머리 → 본문 → 액션), 이 카드는 액션 슬롯을 항상 채운다 —
 * 즉 마지막 `div` 는 언제나 액션 줄이다. `className` 은 부품이 루트에 얹어 주는 공식 손잡이다.
 *
 * ⚠ 부품의 슬롯 순서가 바뀌면 이 규칙은 조용히 무력해진다(푸터가 다시 뜬다). 깨지지는 않는다.
 */
export const GalleryCardShell = styled(PickCard)`
  > div:last-of-type {
    margin-top: auto;
  }
`;

/** 작성자 · 시간 사이의 가운뎃점. 스크린리더에는 소음이라 감춘다. */
export const SubtitleDot = styled.span`
  margin: 0 ${space[1]};
  color: ${color.border};
`;

export const SubtitleAuthor = styled.b`
  color: ${color.textSecondary};
  font-weight: ${font.weight.semibold};
`;

/**
 * 요약 — **제목 다음**이다. 예전 카드는 숫자판이 최상단이라 제목이 셋째 줄로 밀렸고,
 * 격자를 훑을 때 눈이 "이 글이 무엇인가"보다 "얼마"를 먼저 읽었다. 위계를 뒤집었다.
 */
export const CardSummary = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: ${font.leading.normal};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/**
 * 숫자판 — 고르는 카드(brand) 안에 앉는 **읽는 면**(data)이다.
 * 그래서 채도면이 아니라 중립 sunken 면이고, 색은 좌측 4px 오로라 귀(L1)만 갖는다.
 * 반경은 부모가 발행한 `--sb-inner-radius` 를 따라 동심을 유지한다.
 */
export const SimTile = styled.div`
  position: relative;
  margin-top: ${space[4]};
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

  /* 카드(=격자 안의 li)가 hover 되면 숫자판도 한 칸 살아난다. 카드 부상과 한 순간이다. */
  li:hover & {
    background: ${color.surfaceMuted};
  }

  li:hover &::before {
    width: 6px;
  }
`;

/** 액션 줄 — 좌측 계수 묶음 / 우측 공유. `PickCardActions` 안에서 전폭을 채운다. */
export const MetaStrip = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  width: 100%;
  padding-top: ${space[3]};
  border-top: 1px solid ${color.border};
`;

export const MetaCounts = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[4]};
  min-width: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  ${font.numeric}
`;

export const MetaCount = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};

  svg {
    flex: 0 0 auto;
    opacity: 0.8;
  }
`;
