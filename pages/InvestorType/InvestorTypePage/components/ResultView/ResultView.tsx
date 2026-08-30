import { ArrowRight, Link2, RotateCcw } from 'lucide-react';
import { INVESTOR_AXES } from '@/shared/constants/investorType';
import { PORTFOLIO_PRESET_PLACEHOLDERS } from '@/shared/constants/portfolioPresets';
import { PRESET_QUERY_PARAM, SIMULATOR_PATH } from '@/shared/constants/routes';
import { ICON } from '@/shared/styles';
import { toInitials } from '../../InvestorTypePage.utils';
import type { ResultViewProps } from '../../InvestorTypePage.types';
import {
  Disclaimer,
  Stack
} from '../../InvestorTypePage.styled';
import {
  AllocationBar,
  AllocationItem,
  AllocationLegend,
  AllocationSegment,
  AllocationTicker,
  AxisCaption,
  AxisDot,
  AxisHead,
  AxisLabels,
  AxisName,
  AxisRow,
  AxisTrack,
  MatchAvatar,
  MatchBody,
  MatchItem,
  MatchList,
  MatchName,
  MatchWhy,
  NextGrid,
  NextLink,
  Panel,
  PanelTitle,
  PresetCta,
  ResultBody,
  ResultEyebrow,
  ResultHead,
  ResultTagline,
  ResultTitle,
  ShareButton,
  ShareGhost,
  ShareNotice,
  ShareRow
} from './ResultView.styled';

/**
 * 투자 성향 테스트 — **결과 화면**(순수 뷰).
 *
 * 갈라 낸 이유는 문항 화면과 같다(2026-08-27) — 한 파일이 435줄로 두 화면을 함께 들고 있었다.
 * 둘은 같은 라우트를 쓰지만 **함께 보이는 일이 없다**.
 *
 * ## 이 화면의 착지점은 하나다
 * 🔴 "이 구성으로 계산해 보기". 여기서 끊기면 사용자는 계산기로 건너가 종목을 손으로 다시 찾아
 * 넣어야 하고, 테스트는 "재미로 해 봤다"로 끝난다. 그래서 그 버튼만 **주 버튼 무게**를 갖고,
 * 나머지(이어서 볼 곳·공유·다시 하기)는 전부 그보다 약하다.
 */
export default function ResultView({
  profile,
  scores,
  shareNotice,
  onShare,
  onRestart,
  onNext
}: ResultViewProps) {
  const preset = PORTFOLIO_PRESET_PLACEHOLDERS.find((candidate) => candidate.id === profile.presetId);

  return (
    <Stack>
      {/* 🔴 넷이 **한 카드**다. 12문항을 다 푼 보상이 페이지 배경 위 맨 텍스트로 흩어져 있으면
          그렇게 읽히지 않는다(styled 의 ResultHead 주석). */}
      <ResultHead>
        <ResultEyebrow>답해 주신 12문항으로 본 성향</ResultEyebrow>
        <ResultTitle>{profile.name}</ResultTitle>
        <ResultTagline>{profile.tagline}</ResultTagline>
        <ResultBody>{profile.description}</ResultBody>
      </ResultHead>

      <Panel>
        <PanelTitle>네 축에서 어디쯤인가</PanelTitle>
        {INVESTOR_AXES.map((axis) => (
          <AxisRow key={axis.id}>
            {/* 🔴 축 이름이 없으면 사용자는 막대 넷을 보면서 그것들이 무슨 관계인지 알 수 없다. */}
            <AxisHead>
              <AxisName>{axis.label}</AxisName>
              <AxisCaption>{axis.caption}</AxisCaption>
            </AxisHead>
            <AxisTrack
              role="img"
              aria-label={`${axis.label}: ${axis.low} 0, ${axis.high} 100 중 ${scores[axis.id]}`}
            >
              <AxisDot $percent={scores[axis.id]} />
            </AxisTrack>
            <AxisLabels>
              <span>{axis.low}</span>
              <span>{axis.high}</span>
            </AxisLabels>
          </AxisRow>
        ))}
      </Panel>

      {/* 🔴 빈 배열이 정상 상태다 — 13F 로 뒷받침되지 않는 유형은 대가를 대지 않는다. */}
      {profile.investors.length > 0 ? (
        <Panel>
          <PanelTitle>공시에서 비슷한 모습을 보이는 투자자</PanelTitle>
          <MatchList>
            {profile.investors.map((match) => (
              <MatchItem key={match.cik}>
                <MatchAvatar aria-hidden>{toInitials(match.person)}</MatchAvatar>
                <MatchBody>
                  <MatchName>{match.person}</MatchName>
                  <MatchWhy>{match.why}</MatchWhy>
                </MatchBody>
              </MatchItem>
            ))}
          </MatchList>
          <Disclaimer>
            분기마다 공시되는 13F 보유 내역을 견준 것이며, 실시간 정보도 따라 하기를 권하는 것도 아닙니다.
          </Disclaimer>
        </Panel>
      ) : null}

      {preset ? (
        <Panel>
          <PanelTitle>성향과 결이 비슷한 구성 예시</PanelTitle>
          <MatchName>{preset.title}</MatchName>
          <MatchWhy>{preset.hook}</MatchWhy>

          {/* 🔴 숫자만 나열하면 무엇이 주인공인지 눈으로 더해야 안다. 막대가 그걸 한눈에 준다.
              색은 hue 한 계열의 농도 차이로만 가른다 — 여섯 색을 주면 결과의 주인공(유형)보다
              이 패널이 시끄러워진다. */}
          <AllocationBar
            role="img"
            aria-label={`구성 비중: ${preset.allocations
              .map((slice) => `${slice.ticker} ${slice.weight}%`)
              .join(', ')}`}
          >
            {preset.allocations.map((slice, index) => (
              <AllocationSegment
                key={slice.ticker}
                $weight={slice.weight}
                /* 앞쪽(비중이 큰 쪽)이 진하다. ⚠ 폭을 넓혔다(2026-08-27) — 22→8 은 여섯 칸에
                   3씩이라 인접 칸이 붙어 보였다. 지금은 34→8 을 칸 수에 맞춰 균등하게 나눈다. */
                $depth={Math.max(8, 34 - index * Math.ceil(26 / Math.max(1, preset.allocations.length - 1)))}
              />
            ))}
          </AllocationBar>
          <AllocationLegend>
            {preset.allocations.map((slice) => (
              <AllocationItem key={slice.ticker}>
                <AllocationTicker>{slice.ticker}</AllocationTicker>
                <span>{slice.weight}%</span>
              </AllocationItem>
            ))}
          </AllocationLegend>
          {/* 🔴 이 흐름의 **착지점**이다. 여기서 끊기면 사용자는 계산기로 건너가 종목을 손으로
              다시 찾아 넣어야 하고, 테스트는 "재미로 해 봤다"로 끝난다.
              ⚠ 쿼리는 시뮬레이터의 `usePresetQueryApply` 가 읽어 **확인 모달**을 띄운다 —
                이미 포트폴리오가 있는 사용자를 링크 하나로 덮지 않기 위해서다. */}
          <PresetCta
            to={`${SIMULATOR_PATH}?${PRESET_QUERY_PARAM}=${preset.id}`}
            onClick={() => onNext('prefill')}
          >
            이 구성으로 계산해 보기
            <ArrowRight size={ICON.md} strokeWidth={2} aria-hidden focusable={false} />
          </PresetCta>
        </Panel>
      ) : null}

      <Panel>
        <PanelTitle>이어서 볼 곳</PanelTitle>
        <NextGrid>
          {profile.next.map((link) => (
            <li key={link.to}>
              <NextLink
                to={link.to}
                onClick={() => onNext('next')}
              >
                {link.label}
              </NextLink>
            </li>
          ))}
        </NextGrid>
      </Panel>

      <ShareRow>
        <ShareButton type="button" onClick={onShare}>
          <Link2 size={ICON.md} strokeWidth={1.8} aria-hidden focusable={false} />
          링크 복사
        </ShareButton>

        {/* 같은 줄, 한 단 낮은 무게. 결과에서 할 일은 공유·이어보기지 다시 푸는 게 아니다. */}
        <ShareGhost type="button" onClick={onRestart}>
          <RotateCcw size={ICON.sm} strokeWidth={1.8} aria-hidden focusable={false} />
          다시 해보기
        </ShareGhost>

        {/* 이 주소가 곧 결과다 — 압축하지 않아 받는 사람도 무엇인지 읽을 수 있다. */}
        <ShareNotice role="status">{shareNotice}</ShareNotice>
      </ShareRow>

      <Disclaimer>
        입력하신 답을 그대로 분류해 보여 주는 참고 자료이며 투자 자문이 아닙니다. 실제 판단은 본인의 상황과
        책임으로 하셔야 합니다.
      </Disclaimer>
    </Stack>
  );
}
