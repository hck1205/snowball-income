import { color } from '@/shared/styles';
import type { GoalMeterProps } from './GoalMeter.types';
import {
  MeterBody,
  MeterLabel,
  MeterRing,
  MeterRingCenter,
  MeterRingFrame,
  MeterRingPlaceholder,
  MeterRoot,
  MeterSentence,
  MeterValue
} from './GoalMeter.styled';

/**
 * 달성률 미터 — **박스가 아니다**(카드 안에서 위계를 만드는 한 덩어리).
 *
 * `StatTile`의 진행률을 쓰지 않는 이유 두 가지: ①이 화면에서 달성률은 보조 지표가 아니라
 * 주인공 숫자라 타일 안에 접어 넣으면 위계가 죽는다 ②타일의 진행률은 값과 별개로 같은 숫자를
 * 한 번 더 낭독한다(중복).
 *
 * 접근성: 값이 있을 때만 `role="progressbar"`를 부여하고, 로딩 중에는 링을 장식(`aria-hidden`)으로
 * 남긴다(값 없는 progressbar는 "0%"로 읽혀 거짓말이 된다). 🔴 색만으로는 아무것도 전달하지 않는다 —
 * 링 한가운데의 숫자와 오른쪽 병기 문장이 같은 사실을 글자로 말한다(눈금 줄을 되살리지 마라 —
 * 이유는 `GoalMeter.styled.ts` 의 근거 주석).
 */
export default function GoalMeter({ percent, label, ariaLabel, emptyValue, sentence, valueText }: GoalMeterProps) {
  const hasValue = percent !== null;
  /*
   * 채운 각도의 색. 100% 는 `success`(도달), 그 아래는 `accentAlt`(목표·추천 축).
   * 🔴 이건 **거드는 채널**이다 — 도달 여부는 카드 머리의 배지와 상태 줄이 글자로 말한다.
   */
  const fill = hasValue && percent >= 100 ? color.success : color.accentAlt;
  const arc = hasValue ? `conic-gradient(${fill} 0% ${percent}%, ${color.progressTrack} ${percent}% 100%)` : undefined;

  return (
    <MeterRoot>
      <MeterRingFrame>
        {hasValue ? (
          <MeterRing
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label={ariaLabel}
            /* 각도는 연속값이라 클래스가 아니라 style 로 — 재계산마다 스타일시트가 불어나지 않게. */
            style={{ background: arc }}
          />
        ) : (
          <MeterRingPlaceholder aria-hidden />
        )}

        <MeterRingCenter>
          <MeterValue>{hasValue ? (valueText ?? emptyValue) : emptyValue}</MeterValue>
          <MeterLabel>{label}</MeterLabel>
        </MeterRingCenter>
      </MeterRingFrame>

      <MeterBody>{sentence ? <MeterSentence>{sentence}</MeterSentence> : null}</MeterBody>
    </MeterRoot>
  );
}
