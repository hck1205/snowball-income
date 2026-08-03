import { ListSourceError, USER_AGENT, canonicalTicker } from './sourceCommon';

/**
 * 위키피디아 `S&P 500 Dividend Aristocrats` 구성종목 표.
 *
 * NOBL 보유내역의 **교차검증 소스**이자 **회사명·섹터의 공급원**이다(NOBL CSV 에는 섹터가 없고
 * 회사명도 `COCA-COLA CO/THE` 같은 거래소 표기다). 2026-08-04 실측: 두 소스가 69종에서 완전히 일치했다
 * (위키피디아에만 0종, NOBL 에만 0종).
 *
 * ## 왜 렌더된 HTML 이 아니라 wikitext 인가
 * `action=parse&prop=wikitext` 는 14KB 짜리 JSON 한 번이고 표 마크업이 안정적이다. 렌더 HTML 은
 * 스킨·템플릿 변경에 훨씬 자주 흔들린다.
 *
 * ## 라이선스
 * 위키피디아 본문은 **CC BY-SA 4.0** 이다(API `meta=siteinfo&siprop=rightsinfo` 로 확인). 그래서 이
 * 소스로 만든 화면에는 **출처 표기가 의무**다 — 목록 페이지의 출처 줄이 그 역할을 한다.
 */
const WIKIPEDIA_API_URL =
  'https://en.wikipedia.org/w/api.php?action=parse&page=S%26P_500_Dividend_Aristocrats&prop=wikitext&format=json&formatversion=2';

export const WIKIPEDIA_PAGE_URL = 'https://en.wikipedia.org/wiki/S%26P_500_Dividend_Aristocrats';

export type WikipediaAristocrat = {
  ticker: string;
  name: string;
  /** 위키피디아가 적어 준 GICS 섹터 문자열. 정규화는 호출부(`shared/constants/dividendLists`)가 한다. */
  sectorLabel: string;
};

/**
 * 위키 링크·굵게·주석을 벗겨 순수 텍스트만 남긴다.
 * `[[Brown & Brown|Brown & Brown Inc.]]` → `Brown & Brown Inc.` / `[[AbbVie]]` → `AbbVie`
 */
const stripWikiMarkup = (raw: string): string =>
  raw
    .replace(/<ref[\s\S]*?(\/>|<\/ref>)/gi, '')
    .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1')
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/<[^>]+>/g, '')
    .trim();

export const parseAristocratsWikitext = (wikitext: string): WikipediaAristocrat[] => {
  // 표는 `id="constituents"` 로 특정한다 — 문서에 다른 표가 생겨도 엉뚱한 것을 읽지 않는다.
  const start = wikitext.indexOf('id="constituents"');
  if (start < 0) throw new ListSourceError('위키피디아 문서에서 constituents 표를 찾지 못했다');
  const end = wikitext.indexOf('|}', start);
  const table = wikitext.slice(start, end < 0 ? undefined : end);

  const rows: WikipediaAristocrat[] = [];
  // 행 구분은 `|-`, 셀 구분은 `||`(한 줄에 몰아 쓰는 형태). 첫 블록은 헤더라 버린다.
  for (const block of table.split('|-').slice(1)) {
    const cells = block.split('||').map((cell) => stripWikiMarkup(cell.replace(/^\s*\|/, '')));
    const ticker = cells[0] ?? '';
    if (ticker.length === 0) continue;
    rows.push({
      ticker: canonicalTicker(ticker),
      name: cells[1] ?? '',
      sectorLabel: cells[2] ?? ''
    });
  }

  if (rows.length === 0) throw new ListSourceError('위키피디아 constituents 표에서 한 행도 뽑지 못했다');
  return rows;
};

export const fetchWikipediaAristocrats = async (
  fetchImpl: typeof fetch = fetch
): Promise<WikipediaAristocrat[]> => {
  let response: Response;
  try {
    response = await fetchImpl(WIKIPEDIA_API_URL, { headers: { 'user-agent': USER_AGENT } });
  } catch (error) {
    throw new ListSourceError(`위키피디아 요청 실패: ${String(error)}`);
  }
  if (!response.ok) throw new ListSourceError(`위키피디아 HTTP ${response.status}`);

  const payload = (await response.json()) as { parse?: { wikitext?: string }; error?: { code?: string } };
  if (payload.error) throw new ListSourceError(`위키피디아 API 오류: ${payload.error.code ?? 'unknown'}`);
  const wikitext = payload.parse?.wikitext;
  if (typeof wikitext !== 'string') throw new ListSourceError('위키피디아 응답에 wikitext 가 없다');

  return parseAristocratsWikitext(wikitext);
};
