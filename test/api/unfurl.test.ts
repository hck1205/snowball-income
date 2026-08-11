// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from '@/server/handlers/Unfurl/Unfurl';

/**
 * `/api/unfurl` — 링크 미리보기.
 *
 * 🔴 **이 파일이 지키는 것의 절반은 SSRF 다.** 서버가 임의의 URL 을 대신 열어 주는 엔드포인트라,
 * 가드가 한 줄 빠지면 내부망·클라우드 메타데이터(169.254.169.254)가 그대로 열린다. 그 결함은
 * 화면에 아무 증상도 남기지 않으므로 **테스트 말고는 잡을 방법이 없다.**
 *
 * ⚠ 가드가 막았는지 재는 방법: 막혔다면 **fetch 가 아예 불리지 않는다**(400). 응답 코드만 보면
 *   "네트워크가 실패해서 400" 인지 "가드가 막아서 400" 인지 구분되지 않는다.
 */
const HTML = `
<!doctype html><html><head>
  <title>원문 제목 &amp; 부제</title>
  <meta property="og:title" content="오픈그래프 제목" />
  <meta property="og:description" content="두세 줄 요약입니다." />
  <meta property="og:image" content="/thumb.png" />
  <meta property="og:site_name" content="어느 신문" />
</head><body>본문은 가져오지 않는다</body></html>`;

const htmlResponse = (body = HTML) =>
  new Response(body, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });

const call = (url: string) => handler(new Request(`https://hungry-hippo.xyz/api/unfurl?url=${encodeURIComponent(url)}`));

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async () => htmlResponse());
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SSRF 가드 — 서버가 열어 주면 안 되는 곳', () => {
  it.each([
    ['localhost', 'http://localhost/admin'],
    ['루프백 IP', 'http://127.0.0.1/'],
    ['0.0.0.0', 'http://0.0.0.0/'],
    ['사설 10/8', 'http://10.0.0.5/'],
    ['사설 172.16/12', 'http://172.20.1.1/'],
    ['사설 192.168/16', 'http://192.168.0.1/'],
    ['클라우드 메타데이터 169.254', 'http://169.254.169.254/latest/meta-data/'],
    ['IPv6 루프백', 'http://[::1]/'],
    ['IPv6 유니크로컬', 'http://[fd00::1]/'],
    ['.local 이름', 'http://printer.local/'],
    ['file 스킴', 'file:///etc/passwd'],
    ['gopher 스킴', 'gopher://evil/1'],
    ['data 스킴', 'data:text/html,<b>x</b>']
  ])('%s 는 거절하고 **fetch 를 아예 부르지 않는다**', async (_label, url) => {
    const response = await call(url);

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('url 파라미터가 없으면 400 이다', async () => {
    const response = await handler(new Request('https://hungry-hippo.xyz/api/unfurl'));
    expect(response.status).toBe(400);
  });

  /**
   * 🔴 이 계약이 가장 중요하다. 공개 도메인이 사설 IP 로 302 하는 것이 이 공격의 고전적 형태이고,
   * `redirect: 'follow'` 로 바꾸는 순간 조용히 뚫린다(중간 홉을 볼 수 없게 된다).
   */
  it('공개 주소가 사설 IP 로 리다이렉트하면 따라가지 않는다', async () => {
    fetchMock.mockImplementationOnce(
      async () => new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/' } })
    );

    const response = await call('https://news.example.com/article');

    expect(response.status).toBe(422);
    // 첫 홉만 열고 멈춘다 — 두 번째 홉은 가드가 막는다.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('리다이렉트가 끝없이 이어지면 상한에서 끊는다', async () => {
    fetchMock.mockImplementation(
      async () => new Response(null, { status: 302, headers: { location: 'https://news.example.com/next' } })
    );

    const response = await call('https://news.example.com/start');

    expect(response.status).toBe(422);
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(4); // 최초 + 리다이렉트 3회
  });

  it('HTML 이 아니면 파싱하지 않는다 — 큰 바이너리를 읽어 들이지 않는다', async () => {
    fetchMock.mockImplementationOnce(
      async () => new Response('%PDF-1.4', { status: 200, headers: { 'content-type': 'application/pdf' } })
    );

    expect((await call('https://example.com/paper.pdf')).status).toBe(422);
  });

  it('응답이 실패하면 422 로 떨어진다(500 을 흘리지 않는다)', async () => {
    fetchMock.mockImplementationOnce(async () => {
      throw new Error('network down');
    });

    expect((await call('https://example.com/x')).status).toBe(422);
  });
});

describe('링크 메타 추출', () => {
  it('og 태그에서 제목·요약·썸네일·출처를 뽑는다', async () => {
    const body = await (await call('https://news.example.com/a')).json();

    expect(body).toMatchObject({
      url: 'https://news.example.com/a',
      title: '오픈그래프 제목',
      summary: '두세 줄 요약입니다.',
      source: '어느 신문'
    });
  });

  it('상대 경로 썸네일을 절대 URL 로 만든다', async () => {
    const body = await (await call('https://news.example.com/a')).json();
    expect(body.image).toBe('https://news.example.com/thumb.png');
  });

  it('썸네일이 사설 주소를 가리키면 버린다 — og:image 도 남이 준 값이다', async () => {
    fetchMock.mockImplementationOnce(async () =>
      htmlResponse('<html><head><meta property="og:image" content="http://169.254.169.254/x.png"></head></html>')
    );

    const body = await (await call('https://news.example.com/a')).json();
    expect(body.image).toBeUndefined();
  });

  it('og:title 이 없으면 title 태그를, 그것도 없으면 도메인을 쓴다 — 빈 카드를 만들지 않는다', async () => {
    fetchMock.mockImplementationOnce(async () =>
      htmlResponse('<html><head><title>타이틀 태그</title></head></html>')
    );
    expect((await (await call('https://news.example.com/a')).json()).title).toBe('타이틀 태그');

    fetchMock.mockImplementationOnce(async () => htmlResponse('<html><head></head></html>'));
    expect((await (await call('https://news.example.com/a')).json()).title).toBe('news.example.com');
  });

  it('HTML 엔티티를 풀어서 담는다', async () => {
    fetchMock.mockImplementationOnce(async () =>
      htmlResponse('<html><head><meta property="og:title" content="A &amp; B &quot;C&quot;"></head></html>')
    );

    expect((await (await call('https://news.example.com/a')).json()).title).toBe('A & B "C"');
  });

  /** 🔴 저작권 — 담는 것은 요약 두세 줄까지다. 원문을 통째로 복제하지 않는다. */
  it('요약이 길면 잘라 담는다', async () => {
    const long = '가'.repeat(600);
    fetchMock.mockImplementationOnce(async () =>
      htmlResponse(`<html><head><meta property="og:description" content="${long}"></head></html>`)
    );

    const summary: string = (await (await call('https://news.example.com/a')).json()).summary;
    expect(summary.length).toBeLessThanOrEqual(300);
    expect(summary.endsWith('…')).toBe(true);
  });

  it('응답을 캐시하지 않는다 — 원문이 바뀌면 다음 사람이 새 값을 받아야 한다', async () => {
    const response = await call('https://news.example.com/a');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});

/**
 * **국회공보 릴레이** (`?relay=assembly`) — 2026-08-12 신설.
 *
 * ## 왜 이 기능이 여기 있나
 * GitHub 러너(미국)에서 국회 사이트가 `Connection timed out` 으로 막혀 데이터 갱신 워크플로가
 * 며칠째 실패했다. 우리 함수가 도는 싱가포르에서는 열린다(실측 200/1.6초). 그래서 러너 → 이 함수 →
 * 국회 로 한 홉을 우회한다. 새 함수를 만들지 못한 이유는 Vercel Hobby 의 함수 상한(12개, 여유 0)이다.
 *
 * ## 🔴 이 테스트가 지키는 것 — "릴레이는 오픈 프록시가 아니다"
 * 위의 `?url=` 경로는 호출자가 준 주소를 열지만, 릴레이는 **호스트가 코드에 박혀 있다.**
 * 호출자가 고를 수 있는 것은 허용된 경로 둘과 그 질의문자열뿐이다. 그 경계가 무너지면 이 엔드포인트가
 * 진짜 오픈 프록시가 되므로, 경로 화이트리스트와 호스트 고정을 여기서 못 박는다.
 */
describe('국회공보 릴레이 — 오픈 프록시가 아니다', () => {
  const relay = (params: string) => handler(new Request(`https://hungry-hippo.xyz/api/unfurl?relay=assembly&${params}`));

  it('허용된 경로는 국회 호스트로 나간다 — 호스트는 호출자가 고르지 못한다', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('<html>목록</html>', { status: 200, headers: { 'content-type': 'text/html' } })
    );

    const response = await relay('path=%2Fportal%2Fcnts%2FcntsNamgzn%2Fgongbo.do&pageUnit=400');

    expect(response.status).toBe(200);
    const [calledUrl] = fetchMock.mock.calls[0];
    expect(String(calledUrl)).toBe(
      'https://www.assembly.go.kr/portal/cnts/cntsNamgzn/gongbo.do?pageUnit=400'
    );
  });

  it('첨부 다운로드 경로도 허용된다(PDF 원문)', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('%PDF-1.4', { status: 200, headers: { 'content-type': 'application/pdf' } })
    );

    const response = await relay('path=%2Fportal%2Fcmmn%2Ffile%2FfileDown.do&atchFileId=abc&fileSn=1');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/pdf');
  });

  it('🔴 허용 목록에 없는 경로는 나가지 않는다 — fetch 가 아예 불리지 않는다', async () => {
    const response = await relay('path=%2Fanything%2Felse');

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('🔴 경로에 다른 호스트를 심어도 국회를 벗어나지 못한다', async () => {
    // `//evil.example/…` 은 프로토콜 상대 주소로 읽히기를 노린 형태다.
    const response = await relay('path=%2F%2Fevil.example%2Fportal%2Fcnts%2FcntsNamgzn%2Fgongbo.do');

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('릴레이는 SSRF 가드를 지나지 않지만, 그 대신 경로가 고정이다 — url 파라미터를 요구하지 않는다', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('<html/>', { status: 200, headers: { 'content-type': 'text/html' } })
    );

    // `url` 없이도 200 이다(릴레이가 먼저 갈린다). 이 분기가 뒤로 밀리면 400 이 된다.
    const response = await relay('path=%2Fportal%2Fcnts%2FcntsNamgzn%2Fgongbo.do');

    expect(response.status).toBe(200);
  });

  it('상류가 실패하면 502 로 정직하게 알린다 — 빈 본문을 성공으로 돌려주지 않는다', async () => {
    fetchMock.mockResolvedValueOnce(new Response('nope', { status: 503 }));

    const response = await relay('path=%2Fportal%2Fcnts%2FcntsNamgzn%2Fgongbo.do');

    expect(response.status).toBe(502);
  });
});
