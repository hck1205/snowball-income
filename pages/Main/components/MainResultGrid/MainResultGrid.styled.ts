import styled from '@emotion/styled';
import { ResultGrid } from '@/components/common';
import { color, font, iconOpticalAlign, media, motion, radius, space } from '@/shared/styles';

/**
 * **첫 결과가 처음 나타나는 한 번**의 진입 연출.
 *
 * 프리셋을 고르면 빈 화면이 결과 카드 열 장으로 통째로 바뀐다. 그 교체가 무음 스냅이면
 * 사용자는 "무엇이 어디서 왔는지" 모른 채 낯선 화면을 마주한다. 위에서 아래로 80ms 씩 밀리며
 * 들어오면 시선이 요약 → 차트 → 표 순서로 자연히 흐른다.
 *
 * 🔴 **이것은 "페이지 로드 오케스트레이션"이 아니다**(그건 금지 사항이다). 새로고침·복원·
 *   첫 방문 프리필에서는 **돌지 않는다** — 발동 조건은 `MainResultGrid.utils.ts` 의
 *   `useFirstResultReveal` 이 소유하고, 거기서 세션당 한 번으로 잠근다.
 *   새로고침마다 재생되면 그 순간 금지 사항이 된다.
 *
 * ⚠ 결과 이미지 저장은 이 연출이 끝날 때까지 기다린다(`htmlCapture.ts` 의 `waitForAnimations`) —
 *   지연 구간의 계산값이 `opacity: 0` 이라 그대로 찍으면 카드가 투명한 채로 박힌다(실측 잉크 1.05%).
 *
 * 스태거 간격 80ms 는 이 레포의 유일한 선례(`TickerDetailPage.styled.ts`)와 같은 값이다.
 * 총 260ms = 지연 160ms + 지속 100ms 로 UI 전환 상한(300ms) 아래에 둔다.
 *
 * 지연 구간이 셋뿐인 이유: 카드가 열 장이어도 80ms 씩 곱하면 마지막 카드가 800ms 뒤에 온다.
 * 사용자가 기다리는 화면이 되면 연출이 아니라 지연이다 — 셋째 줄부터는 함께 들어온다.
 *
 * 🔴 `nth-child` 다(구 `nth-of-type` 아님). 2026-08-03 부터 그리드의 직계 자식에 막 머리띠
 *   (`ActBand` = `header`)가 섞여서, 타입별로 세는 `nth-of-type` 은 머리띠와 카드 칸을 **각각**
 *   1·2·3 으로 세어 지연 구간이 둘로 갈렸다. 세는 단위는 "위에서 몇 번째로 들어오는 덩어리인가"다.
 */
export const RevealResultGrid = styled(ResultGrid)<{ $reveal: boolean }>`
  ${({ $reveal }) =>
    $reveal
      ? `
    @media (prefers-reduced-motion: no-preference) {
      > * {
        /* 'backwards' 가 없으면 지연 동안 원래 자리에 그대로 보인다 — 스태거가 통째로 무효가 된다. */
        animation: sb-result-reveal 100ms ${motion.ease} backwards;
      }

      > *:nth-child(2) {
        animation-delay: 80ms;
      }

      > *:nth-child(n + 3) {
        animation-delay: 160ms;
      }

      @keyframes sb-result-reveal {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
      }
    }
  `
      : ''}
`;

/* -------------------------------------------------------------------------- */
/* 막 머리띠 — 결과를 "목록"이 아니라 "장(章)이 있는 문서"로 읽히게 하는 유일한 장치      */
/* -------------------------------------------------------------------------- */

/**
 * 막 제목 크기. 카드 제목(`sectionTitleFontSize` 16~18px)보다 **한 단계 위**여야 한다 —
 * 머리띠가 카드 제목과 같은 크기면 그냥 카드가 하나 더 있는 것으로 읽힌다.
 *
 * 이 앱의 헤딩 서체(`font.display`)는 Bold 한 벌뿐이라 **굵기로는 위계를 만들 수 없다**
 * (`tokens.ts` font.display 주석). 크기가 유일한 채널이다.
 * `0.86rem + 0.9vw` → 400px 이하 18px(`xl`), 800px 이상 24px(`3xl`).
 * `vw` 단독을 피하고 `rem` 을 섞는 이유는 히어로 제목과 같다(WCAG 1.4.4 확대 대응).
 */
const actTitleFontSize = `clamp(${font.size.xl}, calc(0.86rem + 0.9vw), ${font.size['3xl']})`;

/**
 * 막 머리띠 한 줄. `[01] 제목 ──────────` + 아랫줄 힌트.
 *
 * 위쪽 여백이 아래쪽보다 훨씬 큰 것이 핵심이다 — 머리띠는 **앞 막을 끊고 다음 막을 여는** 물건이라
 * 자기 카드 쪽에 붙어 있어야 한다(근접성). 위아래 여백이 같으면 어느 쪽 소속인지 알 수 없다.
 */
export const ActBand = styled.header`
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  grid-template-areas:
    'index title rule'
    'hint hint hint';
  align-items: center;
  column-gap: ${space[3]};
  row-gap: ${space[1]};
  /* 앞 막과의 사이에 숨을 준다. 그리드 gap(12~20px) 위에 얹히므로 실제 간격은 그 합이다. */
  margin-top: clamp(${space[2]}, 2vw, ${space[7]});
  min-width: 0;

  ${media.down('mobileWide')} {
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas:
      'index title'
      'hint hint';
  }
`;

/**
 * 막 표식. 색이 아니라 **형태(테두리 상자)와 숫자**로 말한다 — 회색조로 인쇄해도 막의 시작이 보인다.
 * 숫자 서체는 데이터 숫자와 같은 `dataNumeric` 이라 자릿수가 흔들리지 않는다.
 */
export const ActIndex = styled.p`
  grid-area: index;
  margin: 0;
  /* 🔴 옆에 선 제목이 헤딩 서체(font.display)라 잉크 중심이 라인박스 중심보다 위에 있다 —
     align-items: center 만으로는 이 표식이 제목보다 낮게 앉는다(이 레포의 반복 결함).
     기준은 표식 자신의 크기가 아니라 **제목 크기**다. */
  ${iconOpticalAlign('display', actTitleFontSize)}
  border: 1px solid ${color.borderStrong};
  border-radius: ${radius.xs};
  padding: 2px ${space[2]};
  font-family: ${font.dataNumeric};
  ${font.numeric};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.08em;
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
`;

export const ActTitle = styled.h2`
  grid-area: title;
  margin: 0;
  font-size: ${actTitleFontSize};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.02em;
  color: ${color.text};
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

/**
 * 제목 오른쪽을 채우는 실선. 편집 디자인의 룰(rule)이고, 머리띠가 **줄 전체를 가로지른다**는 신호다 —
 * 이것이 없으면 제목은 그냥 왼쪽에 놓인 글자 한 덩어리고, 막이 어디까지 미치는지 보이지 않는다.
 */
export const ActRule = styled.div`
  grid-area: rule;
  /* 표식과 같은 이유로 제목의 잉크 중심에 맞춘다 — 선만 보정을 빼면 표식과 선이 서로 다른 높이에 선다. */
  ${iconOpticalAlign('display', actTitleFontSize)}
  align-self: center;
  height: 1px;
  background: ${color.border};

  ${media.down('mobileWide')} {
    display: none;
  }
`;

export const ActHint = styled.p`
  grid-area: hint;
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;
