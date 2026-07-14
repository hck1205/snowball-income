import { ImageResponse } from '@vercel/og';
/*
  ⚠ 배럴(`@/pages/Main/hooks/persistence`)이 아니라 `shareLink` 를 **직접** 가져온다.
  배럴은 `usePortfolioPersistence` → `@/shared/lib/analytics` 를 끌고 오는데, analytics 는 모듈 스코프에서
  `import.meta.env.VITE_GA_MEASUREMENT_ID` 를 읽는다. Vercel Node 런타임에는 `import.meta.env` 가 없으므로
  **import 되는 순간 TypeError 로 함수 전체가 죽는다** (아래 try/catch 로도 못 잡는다 — 모듈 평가 단계다).
  실제로 번들해서 Node 로 돌려 보고 잡은 문제다. `/api` 는 Vercel 규약상 앱의 배럴 규칙 예외로 다룬다.
*/
import { decodeSharedScenario } from '@/pages/Main/hooks/persistence/shareLink';
import { summarizeShareCodeForOg, formatOgAmount, formatOgHoldingsLine, type OgCardModel } from '@/pages/Main/utils/ogCard';

/**
 * 동적 OG 이미지 — `/api/og?share=<공유 코드>` → 1200×630 PNG.
 *
 * ## 런타임: Node.js (Edge 아님)
 * `@vercel/og` 는 resvg.wasm(1.4MB) + yoga.wasm(72KB) 를 함께 싣는다. Edge 런타임의 코드 크기 한도는
 * **Hobby 1MB(gzip 후)** 라 폰트/앱 로직까지 얹으면 배포가 실패한다. Node 런타임은 250MB 라 여유가 있고,
 * 현재 Vercel 문서도 OG 생성은 Node 런타임을 권장한다. 그래서 `export const config` 를 두지 않는다(= 기본 Node).
 *
 * ## 절대 5xx 를 내지 않는다
 * 크롤러/스크래퍼(카카오톡·페이스북·트위터)는 미리보기 요청이 실패하면 **카드를 아예 포기**한다.
 * 그래서 모든 실패 경로는 정적 `/og-image.png` 로 302 하거나 기본 카드를 그린다.
 *
 * ## 확장 지점
 * Supabase 시나리오 id(`?id=`)는 아직 지원하지 않는다. `resolveCardModel` 한 곳만 고치면 된다.
 */

const WIDTH = 1200;
const HEIGHT = 630;

/** 브랜드 팔레트 (shared/styles/primitives.ts 의 brand 램프와 동일 값). */
const COLOR = {
  brand800: '#114961',
  brand600: '#136d97',
  brand500: '#1f7ba5',
  brand100: '#d9ecf6',
  surface: '#ffffff',
  textPrimary: '#2b3743',
  textSecondary: '#5f6b78'
} as const;

type LoadedFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: 'normal';
};

/**
 * Pretendard 를 **런타임에 fetch** 한다.
 *
 * - Satori 는 시스템 폰트를 못 쓴다. 한글을 그리려면 폰트 바이트를 직접 넘겨야 한다.
 * - Satori 가 읽는 포맷은 ttf/otf/woff 뿐이다. **woff2 는 지원하지 않는다** → npm `pretendard` 가 웹용으로
 *   기본 제공하는 woff2 는 쓸 수 없고, 같은 패키지의 `dist/public/static/*.otf`(웨이트당 1.5MB)를 쓴다.
 * - 함수 번들에 인라인하지 않고 **우리 배포 도메인의 정적 파일**(`/fonts/*.otf`)로 받아온다.
 *   vite 플러그인이 빌드 때 node_modules → dist/fonts 로 복사한다(레포에 바이너리를 커밋하지 않는다).
 *   외부 CDN(jsDelivr 등)에 의존하지 않으므로 서드파티 장애에 영향받지 않는다.
 * - 모듈 스코프에 캐시해서 워밍된 컨테이너에서는 다시 받지 않는다.
 */
let fontsPromise: Promise<LoadedFont[]> | null = null;

const fetchFont = async (origin: string, file: string, weight: 400 | 700): Promise<LoadedFont> => {
  const response = await fetch(new URL(`/fonts/${file}`, origin));
  if (!response.ok) throw new Error(`font fetch failed: ${file} (${response.status})`);

  return { name: 'Pretendard', data: await response.arrayBuffer(), weight, style: 'normal' };
};

const loadFonts = (origin: string): Promise<LoadedFont[]> => {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      fetchFont(origin, 'Pretendard-Regular.otf', 400),
      fetchFont(origin, 'Pretendard-Bold.otf', 700)
    ]).catch((error: unknown) => {
      // 실패를 캐시하면 컨테이너가 살아 있는 동안 영구히 폴백된다. 다음 요청이 다시 시도하도록 비운다.
      fontsPromise = null;
      throw error;
    });
  }

  return fontsPromise;
};

/** 공유 코드가 없거나/깨졌을 때 그리는 브랜드 기본 카드용 문구. */
const DEFAULT_HEADLINE = '배당 재투자 시뮬레이터';
const DEFAULT_SUBLINE = '배당주·ETF 포트폴리오의 스노우볼 효과를 계산합니다';

const StatCard = ({ label, value, hint }: { label: string; value: string; hint: string }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      backgroundColor: COLOR.surface,
      borderRadius: 24,
      padding: '32px 36px'
    }}
  >
    <div style={{ display: 'flex', fontSize: 26, color: COLOR.textSecondary, fontWeight: 400 }}>{label}</div>
    <div style={{ display: 'flex', fontSize: 76, color: COLOR.brand600, fontWeight: 700, lineHeight: 1.15, marginTop: 6 }}>
      {value}
    </div>
    <div style={{ display: 'flex', fontSize: 24, color: COLOR.textSecondary, fontWeight: 400, marginTop: 4 }}>{hint}</div>
  </div>
);

/** 브랜드 마크 — 눈덩이(스노우볼). 외부 이미지를 받지 않도록 도형으로만 그린다. */
const BrandMark = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 56,
      height: 56,
      borderRadius: 999,
      backgroundColor: COLOR.surface
    }}
  >
    <div style={{ display: 'flex', width: 26, height: 26, borderRadius: 999, backgroundColor: COLOR.brand600 }} />
  </div>
);

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      padding: '56px 64px',
      justifyContent: 'space-between',
      backgroundColor: COLOR.brand600,
      backgroundImage: `linear-gradient(135deg, ${COLOR.brand800} 0%, ${COLOR.brand600} 55%, ${COLOR.brand500} 100%)`,
      fontFamily: 'Pretendard'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <BrandMark />
        <div style={{ display: 'flex', fontSize: 34, color: COLOR.surface, fontWeight: 700, marginLeft: 18 }}>
          Snowball Income
        </div>
      </div>
      <div style={{ display: 'flex', fontSize: 24, color: COLOR.brand100, fontWeight: 400 }}>{DEFAULT_HEADLINE}</div>
    </div>
    {children}
  </div>
);

const ScenarioCard = ({ model }: { model: OgCardModel }) => {
  const holdingsLine = formatOgHoldingsLine(model.holdings, model.hiddenHoldingCount);
  const contributionLine = `월 ${formatOgAmount(model.monthlyContribution)} 적립 · ${model.durationYears}년 투자`;
  // `targetReachedYear` 는 **달력 연도**다(연차가 아니다). 앱의 `targetYearLabel` 과 같은 표기를 쓴다.
  const targetLine =
    model.targetReachedYear !== null ? `목표 월 배당 ${model.targetReachedYear}년 도달` : '기간 내 목표 미도달';

  return (
    <Shell>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: 44, color: COLOR.surface, fontWeight: 700 }}>{holdingsLine}</div>
        <div style={{ display: 'flex', fontSize: 26, color: COLOR.brand100, fontWeight: 400, marginTop: 10 }}>
          {contributionLine}
        </div>
      </div>

      <div style={{ display: 'flex', width: '100%' }}>
        <StatCard
          label="예상 월 배당 (세후)"
          value={formatOgAmount(model.finalMonthlyDividend)}
          hint={`${model.durationYears}년 후`}
        />
        <div style={{ display: 'flex', width: 24 }} />
        <StatCard label="예상 최종 자산" value={formatOgAmount(model.finalAssetValue)} hint={targetLine} />
      </div>

      <div style={{ display: 'flex', fontSize: 22, color: COLOR.brand100, fontWeight: 400 }}>
        입력한 가정을 그대로 계산한 시뮬레이션 결과입니다. 투자 자문이 아닙니다.
      </div>
    </Shell>
  );
};

const DefaultCard = () => (
  <Shell>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', fontSize: 64, color: COLOR.surface, fontWeight: 700 }}>배당 재투자 시뮬레이터</div>
      <div style={{ display: 'flex', fontSize: 30, color: COLOR.brand100, fontWeight: 400, marginTop: 16 }}>
        {DEFAULT_SUBLINE}
      </div>
    </div>
    <div style={{ display: 'flex', width: '100%' }}>
      <StatCard label="포트폴리오" value="비중 조절" hint="종목별 비중과 재투자 가정" />
      <div style={{ display: 'flex', width: 24 }} />
      <StatCard label="계산" value="월 배당·자산" hint="세후 현금흐름과 목표 도달 시점" />
    </div>
    <div style={{ display: 'flex', fontSize: 22, color: COLOR.brand100, fontWeight: 400 }}>
      입력한 가정을 그대로 계산한 시뮬레이션 결과입니다. 투자 자문이 아닙니다.
    </div>
  </Shell>
);

/**
 * 요청 → 카드 모델. share 코드가 없거나 못 읽으면 null → 기본 카드.
 * (확장 지점) Supabase 시나리오 id 지원 시 여기서 `searchParams.get('id')` 를 처리하면 된다.
 */
const resolveCardModel = (searchParams: URLSearchParams): OgCardModel | null =>
  summarizeShareCodeForOg(searchParams.get('share'), decodeSharedScenario);

/** 같은 share 코드 → 항상 같은 이미지. 1년 immutable 로 박아서 함수 호출 자체를 없앤다. */
const CACHE_SCENARIO = 'public, immutable, no-transform, max-age=31536000';
/** 기본 카드는 코드 배포로 바뀔 수 있으니 하루만. */
const CACHE_DEFAULT = 'public, no-transform, max-age=86400';

export default async function handler(request: Request): Promise<Response> {
  const { searchParams, origin } = new URL(request.url);

  try {
    const fonts = await loadFonts(origin);
    const model = resolveCardModel(searchParams);

    const image = new ImageResponse(model ? <ScenarioCard model={model} /> : <DefaultCard />, {
      width: WIDTH,
      height: HEIGHT,
      fonts
    });

    /*
      ImageResponse 의 `headers` 옵션에 Cache-Control 을 주면 자기 기본값 뒤에 **덧붙는다**
      (`public, immutable, max-age=31536000, public, max-age=86400` 처럼 값이 두 번 들어간다).
      그러면 기본 카드까지 1년 immutable 로 굳어버리므로, 바디만 가져와 헤더를 새로 쓴다.
    */
    return new Response(image.body, {
      status: 200,
      headers: {
        'content-type': 'image/png',
        'cache-control': model ? CACHE_SCENARIO : CACHE_DEFAULT
      }
    });
  } catch (error) {
    // 폰트를 못 받았거나 Satori 가 실패한 경우. 5xx 대신 정적 OG 이미지로 넘긴다.
    console.error('[og] falling back to the static image', error);

    return new Response(null, {
      status: 302,
      headers: {
        Location: new URL('/og-image.png', origin).toString(),
        'Cache-Control': 'public, no-transform, max-age=300'
      }
    });
  }
}
