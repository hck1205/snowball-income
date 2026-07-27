import type { GoalMeterProps } from './GoalMeter.types';
import { MeterFill, MeterHead, MeterLabel, MeterRoot, MeterSentence, MeterTrack, MeterValue } from './GoalMeter.styled';

/**
 * 달성률 미터 — **박스가 아니다**(카드 안에서 위계를 만드는 한 덩어리).
 *
 * `StatTile`의 진행률을 쓰지 않는 이유 두 가지: ①이 화면에서 달성률은 보조 지표가 아니라
 * 주인공 숫자라 타일 안에 접어 넣으면 위계가 죽는다 ②타일의 진행률은 값과 별개로 같은 숫자를
 * 한 번 더 낭독한다(중복). 토큰·모션 규칙은 타일과 동일하게 맞춘다.
 *
 * 접근성: 값이 있을 때만 `role="progressbar"`를 부여하고, 로딩 중에는 트랙을 장식(`aria-hidden`)으로
 * 남긴다(값 없는 progressbar는 "0%"로 읽혀 거짓말이 된다). 색만으로는 아무것도 전달하지 않으므로
 * 아래 병기 문장이 같은 사실을 문장으로 말한다.
 */
export default function GoalMeter({ percent, label, ariaLabel, emptyValue, sentence, valueText }: GoalMeterProps) {
  const hasValue = percent !== null;

  return (
    <MeterRoot>
      <MeterHead>
        <MeterLabel>{label}</MeterLabel>
        <MeterValue>{hasValue ? (valueText ?? emptyValue) : emptyValue}</MeterValue>
      </MeterHead>

      {hasValue ? (
        <MeterTrack role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label={ariaLabel}>
          {/* 폭은 연속값이라 클래스가 아니라 style로 — 재계산마다 스타일시트가 불어나지 않게. */}
          <MeterFill style={{ width: `${percent}%` }} />
        </MeterTrack>
      ) : (
        <MeterTrack aria-hidden />
      )}

      {sentence ? <MeterSentence>{sentence}</MeterSentence> : null}
    </MeterRoot>
  );
}
