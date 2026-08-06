import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Compass, LineChart, List, Wallet } from 'lucide-react';
import { PageHero, PageFooter, PickCard, PickCardGrid } from '@/components/common';
import type { PickCapAxis } from '@/components/common';
import { TickerPageShell } from '@/pages/Ticker/components';
import { SIMULATOR_PATH } from '@/shared/constants/routes';
import {
  DestinationHint,
  DestinationSection,
  DestinationTitle,
  PageStack,
  RequestedPath
} from './NotFound.styled';

/**
 * 404 — 어떤 라우트에도 맞지 않는 주소가 도착하는 화면.
 *
 * 예전에는 `router/routes.tsx` 의 `*` 가 `<Navigate to="/" replace />` 라 **잘못된 주소가 조용히
 * 홈으로 갔다.** 사용자는 자기가 오타를 냈는지, 그 페이지가 없어졌는지, 앱이 고장 났는지 알 수 없었고
 * 주소창 기록도 사라져 되돌아갈 수도 없었다. 이 화면은 그 세 가지를 분리해서 말한다:
 * **무엇을 요청했는지 · 왜 못 찾았는지 · 어디로 갈 수 있는지.**
 *
 * ## 색을 갖지 않는다
 * `usePageHue` 의 라우트 매핑에 `*` 를 **일부러 추가하지 않았다**. 페이지 hue 는 "여기가 어느 섹션인가"를
 * 말하는 장치인데, 404 는 어느 섹션도 아니다. 색을 하나 배정하면 사용자가 없는 섹션을 배우게 되고,
 * 매핑 표(`usePageHue.utils.ts`)는 "실재하는 화면의 목록"이라는 뜻을 잃는다. 미배정 라우트의 폴백
 * (brand)이 그대로 적용된다.
 *
 * ## 색인 제외
 * 이 화면이 색인되면 검색 결과에서 빈 페이지로 들어오게 된다. 그래서 마운트되는 동안
 * `meta[name="robots"]` 를 `noindex` 로 바꾸고 언마운트 시 되돌린다(`index.html` 의 기본값은 `index, follow`).
 * ⚠ **서버는 여전히 200 을 돌려준다** — `vercel.json` 의 `/(.*) → /index.html` catch-all 때문이고,
 * 상태 코드 변경은 이 트랙의 범위 밖이다(핸드오프에 보고). 다만 JS 를 실행하지 않는 크롤러에게는
 * `index.html` 의 정적 canonical(`/`)이 그대로 보이므로, 이 주소가 별도 URL 로 색인될 경로는 없다.
 */

const COPY = {
  title: '요청하신 페이지를 찾을 수 없습니다',
  lede: '주소가 바뀌었거나 입력하신 주소에 오타가 있을 수 있습니다. 아래에서 원하시는 화면으로 이동해 주세요.',
  requestedLabel: '요청하신 주소',
  destinationsTitle: '이곳으로 이동하실 수 있습니다',
  documentTitle: '페이지를 찾을 수 없습니다 - Hungry Hippo',
  destinations: [
    {
      // 🔴 시뮬레이터의 주소는 `/simulator` 다(2026-08-01 이전). `/` 로 두면 404 에서 "배당 시뮬레이터"를
      //    누른 사용자가 나중에 랜딩으로 떨어진다 — 404 가 또 하나의 막다른 길이 되는 셈이다.
      to: SIMULATOR_PATH,
      label: '배당 시뮬레이터',
      capLabel: '계산',
      hint: '투자 조건을 넣고 장기 배당 흐름과 목표 달성 시점을 계산합니다.'
    },
    {
      to: '/dividend/portfolio',
      label: '내 포트폴리오',
      capLabel: '보유 현황',
      hint: '보유 종목과 수량만 넣으면 지금 받는 배당을 확인할 수 있습니다.'
    },
    {
      to: '/ticker/all',
      label: '종목 둘러보기',
      capLabel: '종목 자료',
      hint: '배당 ETF·종목 소개를 카테고리별로 모아 두었습니다.'
    }
  ]
} as const;

/**
 * 목적지 카드의 **글리프**. 🔴 `PickCard` 는 `cap.glyph` 를 타입 수준에서 필수로 요구한다 —
 * 캡 색이 단독 채널이 되는 것을 막기 위해서다(회색조로 인쇄해도 세 카드가 구분되어야 한다).
 */
const DESTINATION_ICON = [
  <LineChart key="simulator" size={20} strokeWidth={1.8} aria-hidden focusable={false} />,
  <Wallet key="portfolio" size={20} strokeWidth={1.8} aria-hidden focusable={false} />,
  <List key="tickers" size={20} strokeWidth={1.8} aria-hidden focusable={false} />
];

/**
 * 카드마다 **다른 축**을 준다. 세 목적지가 서로 다른 종류의 화면(계산 · 내 데이터 · 자료)이라
 * 한 줄에 놓였을 때 색이 그 차이를 거든다. 축 이름만 넘기고 실제 색은 부품이 토큰에서 고른다
 * (하드코딩 hex 금지 — `PickCard.utils.ts` 의 AXIS_PAINT 가 유일한 표다).
 */
const DESTINATION_AXIS: readonly PickCapAxis[] = ['brand', 'accent', 'accentAlt'];

/** 마운트 동안만 `noindex`. 되돌릴 값이 없으면(메타가 없는 문서) 아무것도 하지 않는다. */
const useNoIndex = (): void => {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!meta) return;

    const previous = meta.content;
    meta.content = 'noindex, follow';

    return () => {
      meta.content = previous;
    };
  }, []);
};

export default function NotFoundPage() {
  const { pathname } = useLocation();

  useNoIndex();

  useEffect(() => {
    const previous = document.title;
    document.title = COPY.documentTitle;

    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <TickerPageShell>
      <PageStack>
        {/* 헤더 워드마크가 h1 이 아닌 화면이라 제목을 h1 로 올린다(포트폴리오·캘린더와 같은 규칙). */}
        <PageHero
          icon={<Compass size={20} strokeWidth={1.8} aria-hidden focusable={false} />}
          title={COPY.title}
          titleAs="h1"
          lede={COPY.lede}
          meta={
            <>
              {COPY.requestedLabel} <RequestedPath>{pathname}</RequestedPath>
            </>
          }
        />

        <DestinationSection aria-labelledby="not-found-destinations">
          <DestinationTitle id="not-found-destinations">{COPY.destinationsTitle}</DestinationTitle>

          {/* 🔴 `cluster` 를 켜지 않는다 — 레일 캡(6px)은 tintscan 이 면으로 세지 않으므로
              합칠 것이 없다. 클러스터 표식은 라우트당 한 값만 허용되는 자원이라 낭비하지 않는다. */}
          <PickCardGrid as="ul" minColumnWidth="230px">
            {COPY.destinations.map((destination, index) => (
              <PickCard
                key={destination.to}
                as="li"
                to={destination.to}
                title={destination.label}
                cap={{
                  kind: 'rail',
                  axis: DESTINATION_AXIS[index],
                  glyph: DESTINATION_ICON[index],
                  label: destination.capLabel
                }}
              >
                <DestinationHint>{destination.hint}</DestinationHint>
              </PickCard>
            ))}
          </PickCardGrid>
        </DestinationSection>

        <PageFooter />
      </PageStack>
    </TickerPageShell>
  );
}
