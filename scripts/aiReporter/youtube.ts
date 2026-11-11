import { renderTable } from './html';
import type { ReporterFacts } from './types';

/**
 * 파이어족들(`/community/firenow`) 영상 글 — AI 리포터가 **주 1회** 유튜브 영상 하나를 소개한다(2026-11-11).
 *
 * 사용자 결정: 채널 후보는 AI 가 골라 승인 없이 올리고, 링크만이 아니라 본문 텍스트도 쓴다.
 *
 * ## 🔴 영상은 LLM 이 고르지 않는다
 * 아래 채널 목록의 **공개 RSS 피드**(API 키 없음)에서 프로그램이 최신 영상을 가져와 주제 키워드로 거른다.
 * LLM 은 영상 링크를 만들 수 없다 — 지어낸 주소·엉뚱한 영상이 올라갈 길이 없다.
 * LLM 은 영상을 **보지 못한다.** 본문은 RSS 의 제목·설명란(`background`)에 있는 것만으로 쓴다.
 *
 * ## 채널 목록(2026-11-11 선정)
 * 파이어족들에 사람이 올린 영상의 채널 + 유튜브 검색("파이어족 인터뷰"·"조기은퇴 배당" 등) 상위 채널 중
 * FIRE·배당·은퇴 현금흐름을 주로 다루는 곳. 연예·예능 채널은 뺐다. 주제가 섞인 채널도 있어
 * `isFireTopic` 이 제목·설명으로 한 번 더 거른다.
 */
export const FIRE_CHANNELS: readonly { readonly id: string; readonly name: string }[] = [
  { id: 'UC5CyCSvCdoEP-VgQmFq3iww', name: '싱글파이어' },
  { id: 'UCz0vfs-XRMrpG78WtMVE1mg', name: '잼투리' },
  { id: 'UCx7tcHOxncHiyflRNqwICwA', name: '돈워리' },
  { id: 'UC6CNXBevdTEucEoVXu15WYQ', name: '현명한 은퇴자들' },
  { id: 'UC5UFGiELUPSTvFfMGEUxeiQ', name: '자람들 - 자립하는사람들' },
  { id: 'UCxfko2YOD6DODYRGzeOPhIQ', name: '머니인사이드' },
  { id: 'UC4DOaxvxxO6qeXkQLZVBrhw', name: '파이어족 주무관' },
  { id: 'UCA57zlqR9wYq7RZP1y3w4AQ', name: '슬기로운 파이어족' },
  { id: 'UCQrlX5mzcTICHZC1BMVKwhQ', name: '은퇴머니' }
];

export const youtubeFeedUrl = (channelId: string): string => `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

export type YoutubeVideo = {
  readonly videoId: string;
  readonly title: string;
  readonly channelName: string;
  readonly channelId: string;
  /** YYYY-MM-DD (게시일, UTC 날짜). */
  readonly published: string;
  /** 설명란 원문(정리 전). */
  readonly description: string;
};

const decodeXml = (value: string): string =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&');

const tag = (xml: string, name: string): string => {
  const match = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`).exec(xml);
  return match ? decodeXml(match[1]!.trim()) : '';
};

/** 유튜브 채널 RSS(Atom) → 영상 목록. 순수 함수 — 테스트가 고정 XML 로 잠근다. */
export const parseYoutubeFeed = (xml: string): YoutubeVideo[] => {
  const channelName = tag(xml.split('<entry>')[0] ?? '', 'title');
  const channelId = tag(xml.split('<entry>')[0] ?? '', 'yt:channelId');
  return xml
    .split('<entry>')
    .slice(1)
    .map((entry) => ({
      videoId: tag(entry, 'yt:videoId'),
      title: tag(entry, 'title'),
      channelName,
      channelId,
      published: tag(entry, 'published').slice(0, 10),
      description: tag(entry, 'media:description')
    }))
    .filter((video) => /^[\w-]{11}$/.test(video.videoId) && video.title.length > 0);
};

/** FIRE·배당·은퇴 주제 키워드(제목 또는 설명 앞부분). 쇼츠는 뺀다(소개할 내용이 적다). */
const TOPIC = /파이어|FIRE|조기\s*은퇴|은퇴|배당|월\s*\d+\s*만|경제적\s*자유|노후|연금|현금\s*흐름|생활비|퇴사/i;
const SHORTS = /#shorts|#쇼츠/i;
/** 유료 강의·클래스 홍보 영상은 소개하지 않는다 — 우리가 남의 판매를 대신 홍보하는 꼴이 된다. */
const PROMO = /원데이\s*클래스|수강|강의\s*신청|신청\s*방법|얼리버드|할인\s*코드/;

export const isFireTopic = (video: YoutubeVideo): boolean =>
  !SHORTS.test(`${video.title} ${video.description}`) &&
  !PROMO.test(`${video.title} ${video.description}`) &&
  TOPIC.test(`${video.title} ${video.description.slice(0, 300)}`);

/** 영상을 고를 수 있는 기간(게시 후 일수). 너무 오래된 영상은 "이번 주 소개"로 어색하다. */
export const FIRE_VIDEO_MAX_AGE_DAYS = 45;

/**
 * 후보 중 하나 — 주제에 맞고, 기간 안이고, 이미 올린(대장·사람이 올린) 영상이 아닌 것.
 * 같은 채널이 연달아 나오지 않게 직전 채널은 뒤로 미룬다. 최신 영상 우선.
 */
export const pickFireVideo = (
  videos: readonly YoutubeVideo[],
  options: { readonly usedVideoIds: ReadonlySet<string>; readonly today: string; readonly lastChannelId?: string }
): YoutubeVideo | null => {
  const todayMs = Date.parse(options.today);
  const fresh = videos
    .filter((video) => isFireTopic(video))
    .filter((video) => !options.usedVideoIds.has(video.videoId))
    .filter((video) => {
      const age = (todayMs - Date.parse(video.published)) / 86_400_000;
      return age >= 0 && age <= FIRE_VIDEO_MAX_AGE_DAYS;
    })
    .sort((a, b) => b.published.localeCompare(a.published));
  return fresh.find((video) => video.channelId !== options.lastChannelId) ?? fresh[0] ?? null;
};

/** 설명란 정리 — 링크·해시태그·타임스탬프 기호를 덜어 근거 문장으로 쓴다. 길이 상한. */
/** 여기서부터는 영상 이야기가 아니다 — 광고·이벤트·법적 고지 구간. 그 줄부터 뒤를 버린다. */
const DESCRIPTION_STOP = /이벤트|유의사항|준법감시|신용카드|카드\s*만들기|유료\s*광고|PPL|\[광고/i;
/** 한 줄씩 버리는 잡음 — 구독·댓글 유도, 연락처, 다른 영상 추천, 출연자 면책 문구. */
const DESCRIPTION_NOISE =
  /구독|좋아요|알림\s*설정|댓글|이메일|문의|제휴|광고|협찬|instagram|인스타|\S+@\S+\.\w+|이런 영상도|오늘의 증권 뉴스|^💰|^ㅁ\s|개인의 의견/i;

export const cleanDescription = (description: string, max = 1500): string[] => {
  const lines = description.split(/\r?\n/).map((line) => line.replace(/https?:\/\/\S+/g, '').replace(/#[^\s#]+/g, '').trim());
  const stop = lines.findIndex((line) => DESCRIPTION_STOP.test(line));
  return (stop >= 0 ? lines.slice(0, stop) : lines)
    .filter((line) => line.length >= 4 && !DESCRIPTION_NOISE.test(line))
    .reduce<string[]>((acc, line) => (acc.join(' ').length + line.length > max ? acc : [...acc, line]), []);
};

export const youtubeWatchUrl = (videoId: string): string => `https://www.youtube.com/watch?v=${videoId}`;
export const youtubeThumbnail = (videoId: string): string => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

const KO_DATE = (iso: string): string => `${Number(iso.slice(0, 4))}년 ${Number(iso.slice(5, 7))}월 ${Number(iso.slice(8, 10))}일`;

/** 영상 하나 → 글 재료. 순수 함수(네트워크 없음) — 발행 시점에 같은 스냅샷으로 다시 만든다. */
export const buildFireVideoFacts = (video: YoutubeVideo): ReporterFacts => {
  const lines = cleanDescription(video.description);
  const url = youtubeWatchUrl(video.videoId);
  const chapters = lines.filter((line) => /^\d{1,2}:\d{2}/.test(line)).slice(0, 12);

  const tablesHtml =
    renderTable({
      caption: '영상 정보',
      head: ['항목', '내용'],
      rows: [
        ['채널', video.channelName],
        ['게시일', KO_DATE(video.published)],
        ['원본', 'YouTube (위 카드에서 바로 재생)']
      ]
    }) +
    (chapters.length >= 3
      ? renderTable({
          caption: '영상 순서 (설명란 기준)',
          head: ['시간', '내용'],
          rows: chapters.map((line) => {
            const [, time = '', rest = ''] = /^(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–—:]?\s*(.*)$/.exec(line) ?? [];
            return [time, rest];
          })
        })
      : '');

  return {
    topic: 'fire-video',
    factKey: `fire-video:${video.videoId}`,
    asOf: video.published,
    sourceNote: `${video.channelName} 유튜브 영상(${KO_DATE(video.published)} 게시). 본문은 영상 제목·설명란을 바탕으로 작성했고 영상 내용의 요약이 아니다`,
    numbers: [video.title, KO_DATE(video.published)],
    highlights: [`영상 제목: ${video.title}`, `채널: ${video.channelName}`, `게시일: ${KO_DATE(video.published)}`],
    background: lines.length > 0 ? lines : ['설명란이 비어 있다 — 제목만으로 짧게 쓴다.'],
    tablesHtml,
    links: [
      { href: '/dividend/how-much', label: '배당으로 월 생활비, 원금은 얼마나 필요할까' },
      { href: '/simulator', label: '내 조건으로 시뮬레이션하기' }
    ],
    category: null,
    attachment: {
      kind: 'fire',
      payload: {
        url,
        title: video.title.slice(0, 300),
        source: video.channelName.slice(0, 100),
        image: youtubeThumbnail(video.videoId),
        ...(lines[0] ? { summary: lines[0].slice(0, 300) } : {})
      }
    },
    // 스냅샷에는 **정리된 설명란**만 남긴다 — 루틴(LLM)이 광고·이벤트 문구를 읽지 않게. 정리는 멱등이라
    // 발행 시점에 이 스냅샷으로 다시 만들어도 같은 근거 문장이 나온다.
    video: { ...video, description: lines.join('\n') }
  };
};

const FEED_ATTEMPTS = 3;
const FEED_RETRY_MS = 2000;

/**
 * 채널 RSS 를 모두 가져온다. 채널마다 최대 3번 시도하고, 결과(영상 수 또는 HTTP 상태)를 stderr 에 남긴다.
 *
 * 🔴 2026-11-11 첫 실행에서 GitHub Actions 가 영상을 0개 가져왔는데 로그에 아무것도 없었다(실패를 조용히
 * 삼켰다). 원인을 보려면 채널별 상태가 남아야 한다. 호출부는 **전 채널 0개면 실패로 끝낸다**(조용한 건너뜀 금지).
 */
export const fetchFireChannelVideos = async (fetchImpl: typeof fetch = fetch, wait = FEED_RETRY_MS): Promise<YoutubeVideo[]> => {
  const fetchChannel = async (channel: (typeof FIRE_CHANNELS)[number]): Promise<YoutubeVideo[]> => {
    let last = '';
    for (let attempt = 1; attempt <= FEED_ATTEMPTS; attempt += 1) {
      try {
        const response = await fetchImpl(youtubeFeedUrl(channel.id), {
          headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36',
            accept: 'application/atom+xml, application/xml;q=0.9, */*;q=0.8'
          }
        });
        if (response.ok) {
          // 채널 id 는 우리 목록 값을 쓴다 — 피드 머리의 yt:channelId 는 "UC" 접두사가 빠져 나온다(2026-11-11 실측).
          const videos = parseYoutubeFeed(await response.text()).map((video) => ({
            ...video,
            channelId: channel.id,
            channelName: video.channelName || channel.name
          }));
          console.error(`  · RSS ${channel.name}: 영상 ${videos.length}개`);
          return videos;
        }
        last = `HTTP ${response.status}`;
      } catch (error) {
        last = error instanceof Error ? error.message : String(error);
      }
      if (attempt < FEED_ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, wait * attempt));
    }
    console.error(`  · RSS ${channel.name}: 실패(${last}) — 채널 페이지로 대신 읽는다`);
    return fetchChannelFromPages(channel, fetchImpl);
  };
  return (await Promise.all(FIRE_CHANNELS.map(fetchChannel))).flat();
};

const BROWSER_HEADERS = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36',
  'accept-language': 'ko-KR,ko;q=0.9'
};

/** 채널 "동영상" 탭에서 최근 영상 id 들(등장 순, 중복 제거). 쇼츠는 이 탭에 없다. 순수 함수. */
export const parseChannelVideoIds = (html: string, limit = 6): string[] =>
  [...new Set([...html.matchAll(/"videoId":"([\w-]{11})"/g)].map((match) => match[1]!))].slice(0, limit);

/** 영상 페이지의 플레이어 응답에서 제목·게시일·설명란. 못 읽으면 null. 순수 함수. */
export const parseWatchPage = (
  html: string,
  channel: { readonly id: string; readonly name: string }
): YoutubeVideo | null => {
  const match = /var ytInitialPlayerResponse = (\{.*?\});(?:var |<\/script>)/s.exec(html);
  if (!match) return null;
  try {
    const data = JSON.parse(match[1]!) as {
      videoDetails?: { videoId?: string; title?: string; shortDescription?: string; author?: string };
      microformat?: { playerMicroformatRenderer?: { publishDate?: string } };
    };
    const details = data.videoDetails;
    const published = data.microformat?.playerMicroformatRenderer?.publishDate?.slice(0, 10) ?? '';
    if (!details?.videoId || !details.title || !/^\d{4}-\d{2}-\d{2}$/.test(published)) return null;
    return {
      videoId: details.videoId,
      title: details.title,
      channelName: details.author || channel.name,
      channelId: channel.id,
      published,
      description: details.shortDescription ?? ''
    };
  } catch {
    return null;
  }
};

/**
 * RSS 대체 경로(2026-11-11) — 유튜브 RSS 가 채널에 따라 404·500 을 자주 낸다(로컬에서도 9곳 중 5곳 실패 실측).
 * 채널 동영상 탭에서 최근 영상 id 를 얻고, 영상 페이지에서 제목·게시일·설명란을 읽는다.
 */
const fetchChannelFromPages = async (
  channel: (typeof FIRE_CHANNELS)[number],
  fetchImpl: typeof fetch
): Promise<YoutubeVideo[]> => {
  try {
    const list = await fetchImpl(`https://www.youtube.com/channel/${channel.id}/videos`, { headers: BROWSER_HEADERS });
    if (!list.ok) {
      console.error(`  · 채널 페이지 ${channel.name}: 실패(HTTP ${list.status})`);
      return [];
    }
    const ids = parseChannelVideoIds(await list.text());
    const videos: YoutubeVideo[] = [];
    for (const id of ids) {
      const watch = await fetchImpl(youtubeWatchUrl(id), { headers: BROWSER_HEADERS });
      if (!watch.ok) continue;
      const video = parseWatchPage(await watch.text(), channel);
      if (video) videos.push(video);
    }
    console.error(`  · 채널 페이지 ${channel.name}: 영상 ${videos.length}개`);
    return videos;
  } catch (error) {
    console.error(`  · 채널 페이지 ${channel.name}: 실패(${error instanceof Error ? error.message : String(error)})`);
    return [];
  }
};
