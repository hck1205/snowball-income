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
