import styled from '@emotion/styled';
import { DATA_RADIUS, cardElevation, color, font, media, space } from '@/shared/styles';

/* -------------------------------------------------------------------------- */
/* 데크 — 히어로 + 다음 지급일                                                  */
/* -------------------------------------------------------------------------- */

/**
 * 페이지 첫 줄. 종전에는 히어로 하나가 전폭을 먹고 D-Day 는 그 안의 **작은 회색 한 줄**이었다.
 * 지금은 히어로 오른쪽에 **자기 자리를 가진 패널**로 선다 — 이 화면이 약속한 두 가지 중 하나
 * ("다음 배당은 언제")가 첫 화면에서 숫자로 읽힌다.
 *
 * 🔴 2열 트랙은 **패널이 실제로 있을 때만** 깐다(`$split`). 트랙을 상시로 깔면 D-Day 가 없는 화면
 * (보유 0종 · 지급일 미상 · 로딩)에서 히어로가 첫 트랙으로 눌리고 오른쪽 260px 이 **빈 채로 남는다**
 * — 실측으로 잡은 결함이다(1280px 에서 히어로 1160 → 895px). 빈 격자 칸은 레이아웃이 아니라 구멍이다.
 */
export const Deck = styled.div<{ $split: boolean }>`
  display: grid;
  gap: ${space[3]};
  min-width: 0;
  align-items: stretch;

  ${media.up('tabletSm')} {
    grid-template-columns: ${({ $split }) => ($split ? 'minmax(0, 1fr) clamp(200px, 20vw, 260px)' : 'minmax(0, 1fr)')};
  }
`;

/**
 * 다음 배당 지급 예정일 패널.
 *
 * `role="note"` 는 뷰가 붙인다 — 종전 히어로 `notice` 슬롯이 갖던 역할을 그대로 이어받는다
 * (`test/portfolio/portfolioHeroDDay.test.tsx` 가 `queryByRole('note')` 로 존재/부재를 잠근다).
 *
 * 면은 `sunken`(중립) 이다. 🔴 색을 넣지 마라 — 남은 일수는 손익이 아니고, 이 화면의 채도면
 * 예산은 히어로와 푸터가 이미 다 쓰고 있다. 위계는 **숫자 크기 하나**로 만든다.
 */
export const NextPayoutPanel = styled.aside`
  ${cardElevation('sunken')}
  display: grid;
  align-content: center;
  justify-items: start;
  gap: ${space[1]};
  min-width: 0;
  padding: clamp(16px, 2vw, 22px);
  border-radius: ${DATA_RADIUS};
`;

export const NextPayoutLabel = styled.span`
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  letter-spacing: 0.04em;
  line-height: ${font.leading.snug};
  color: ${color.textMuted};
`;

/**
 * 남은 일수. 데이터 서체 + 큰 크기로만 위계를 만든다.
 *
 * 🔴 **색을 넣지 않는다**(구 `DDayValue` 주석의 결정 그대로) — 이 앱에서 색이 붙은 숫자는 손익을
 * 뜻하는데 남은 일수는 손익이 아니다. 바뀐 것은 크기(16px 배지 → 30~44px 표제)뿐이다.
 *
 * 🔴 상한은 `6xl`(44px) 이다. 종전 하드코딩 `48px` 은 **타이포 스케일 밖**이었고, 그 값이면 이
 * 제품에서 가장 큰 글자가 된다(랜딩·티커 허브의 h1 과 캘린더의 D-N 이 전부 44px 이다).
 * 캘린더의 `NextLeadCountdown` 이 같은 역할(다음 지급까지 D-N)로 `clamp(3xl, 4vw, 6xl)` 을
 * 쓰므로 상한을 맞춘다 — 같은 것을 묻는 숫자가 화면마다 다른 크기로 서면 안 된다.
 */
export const NextPayoutValue = styled.strong`
  font-family: ${font.dataNumeric};
  font-size: clamp(${font.size['4xl']}, 4.2vw, ${font.size['6xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  line-height: ${font.leading.tight};
  color: ${color.text};
  ${font.numeric}
`;

export const NextPayoutTickers = styled.span`
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  overflow-wrap: anywhere;
`;

/*
 * 구 `DDayLine`/`DDayValue`/`DDaySeparator`/`DDayTickers`(히어로 notice 안의 한 줄)는 위
 * `NextPayoutPanel` 3종으로 **대체됐다** — 같은 데이터가 작은 회색 줄에서 데크의 표제 숫자로 승격됐다.
 * 되살리지 마라: 두 표현이 공존하면 같은 날짜가 한 화면에 두 번 뜬다.
 */
