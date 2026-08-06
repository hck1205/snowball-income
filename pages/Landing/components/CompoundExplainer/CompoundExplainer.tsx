import { ArrowRight } from 'lucide-react';
import { SIMULATOR_PATH } from '@/shared/constants/routes';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { LANDING_COPY } from '../../copy';
import {
  ExplainerBody,
  ExplainerLead,
  ExplainerParagraph,
  ExplainerProse,
  FactorCard,
  FactorIndex,
  FactorItem,
  FactorList,
  FactorName,
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
 *
 * ## 2026-08-03: 산문 안의 위계
 * 두 문단이 같은 13px 이라 **어느 쪽이 이 장의 답인지** 화면이 말하지 않았다. 첫 문단(복리의 정의)이
 * 리드 급(15~18px)으로 서고 둘째 문단(조건과 단서)이 본문으로 내려간다 — 문장은 한 글자도 바뀌지 않았다.
 * 🔴 첫 문단을 리드로 승격하는 근거는 **내용**이다(이 장의 결론이 거기 있다). 문단이 늘어나면
 * 인덱스 0 을 자동으로 키우지 말고 어느 문단이 결론인지 다시 정하라.
 *
 * 네 값(곁가지 카드)은 알약 칩에서 **번호가 붙은 목록**이 됐다 — "계산에 필요한 값 네 가지"라는
 * 제목이 개수를 약속하므로 화면도 그 넷을 셀 수 있어야 한다.
 */
export default function CompoundExplainer() {
  const [lead, ...rest] = copy.paragraphs;

  return (
    <ExplainerBody>
      {/* 🔴 링크는 산문 **안**이다(카드 뒤가 아니라). "직접 계산해 보실 수 있습니다"는 설명 문단의
          마무리라, 1단으로 접히는 폭에서도 문맥이 이어져야 한다. */}
      <ExplainerProse>
        <ExplainerLead>{lead}</ExplainerLead>
        {rest.map((paragraph) => (
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
            <ArrowRight size={14} strokeWidth={1.8} aria-hidden focusable={false} />
          </InlineLink>
        </InlineLinkLine>
      </ExplainerProse>

      <FactorCard>
        <FactorTitle>{copy.factorsTitle}</FactorTitle>
        <FactorList>
          {copy.factors.map((factor, index) => (
            <FactorItem key={factor}>
              {/* 번호는 장식이다 — ol 이 이미 순서를 말한다(중복 낭독 방지). */}
              <FactorIndex aria-hidden>{String(index + 1).padStart(2, '0')}</FactorIndex>
              <FactorName>{factor}</FactorName>
            </FactorItem>
          ))}
        </FactorList>
      </FactorCard>
    </ExplainerBody>
  );
}
