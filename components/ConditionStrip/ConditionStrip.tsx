import { Fragment, memo } from 'react';
import type { ConditionStripProps } from './ConditionStrip.types';
import { StripAction, StripItem, StripPrefix, StripRoot, StripSeparator } from './ConditionStrip.styled';

/**
 * "이 결과의 계산 조건" 한 줄.
 *
 * `aria-label` 을 붙이지 않는 이유: 라벨을 달면 항목 텍스트가 통째로 대체돼 화면과 낭독이 갈린다.
 * 대신 시각 숨김 프리픽스를 문단 맨 앞에 두어 **읽히는 문장 자체**가 맥락을 갖게 한다.
 */
function ConditionStripComponent({ items, action }: ConditionStripProps) {
  if (items.length === 0) return null;

  return (
    <StripRoot>
      <StripPrefix>이 결과의 계산 조건: </StripPrefix>
      {items.map((item, index) => (
        <Fragment key={item.key}>
          {index > 0 ? <StripSeparator aria-hidden>·</StripSeparator> : null}
          <StripItem>{item.text}</StripItem>
        </Fragment>
      ))}
      {action ? <StripAction>{action}</StripAction> : null}
    </StripRoot>
  );
}

const ConditionStrip = memo(ConditionStripComponent);

export default ConditionStrip;
