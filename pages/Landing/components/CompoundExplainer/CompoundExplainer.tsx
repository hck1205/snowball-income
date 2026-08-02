import { SIMULATOR_PATH } from '@/shared/constants/routes';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { LANDING_COPY } from '../../copy';
import {
  ExplainerBody,
  ExplainerParagraph,
  ExplainerProse,
  FactorCard,
  FactorItem,
  FactorList,
  FactorTitle,
  InlineLink,
  InlineLinkLine
} from './CompoundExplainer.styled';

const copy = LANDING_COPY.compound;

/**
 * S4 — 재투자와 시간(복리).
 *
 * 🔴 **비유를 쓰지 않는다.** 문단은 "받은 배당으로 다시 산다 → 주식 수가 는다 → 다음 배당이 는다"는
 * **절차**로만 쓰고, 마지막에 그 절차의 이름이 복리임을 밝힌다. 사물에 빗대는 순간 카피 금지 규칙을
 * 어기는 동시에, 정작 무슨 일이 일어나는지는 설명하지 못한다.
 */
export default function CompoundExplainer() {
  return (
    <ExplainerBody>
      {/* 🔴 링크는 산문 **안**이다(카드 뒤가 아니라). "직접 계산해 보실 수 있습니다"는 설명 문단의
          마무리라, 1단으로 접히는 폭에서도 문맥이 이어져야 한다. */}
      <ExplainerProse>
        {copy.paragraphs.map((paragraph) => (
          <ExplainerParagraph key={paragraph.slice(0, 12)}>{paragraph}</ExplainerParagraph>
        ))}

        <InlineLinkLine>
          <InlineLink
            to={SIMULATOR_PATH}
            onClick={() =>
              trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'landing_inline_simulator' })
            }
          >
            {copy.linkText}
          </InlineLink>
        </InlineLinkLine>
      </ExplainerProse>

      <FactorCard>
        <FactorTitle>{copy.factorsTitle}</FactorTitle>
        <FactorList>
          {copy.factors.map((factor) => (
            <FactorItem key={factor}>{factor}</FactorItem>
          ))}
        </FactorList>
      </FactorCard>
    </ExplainerBody>
  );
}
