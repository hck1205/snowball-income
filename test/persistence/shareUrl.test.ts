import {
  buildDbShareUrl,
  buildShareUrl,
  readDbShareKeyFromHref,
  readShareCodeFromHref,
  resolveShareRedirectPath,
  S_QUERY_PARAM,
  SHARE_QUERY_PARAM,
  SHARE_VERSION_QUERY_PARAM,
  stripShareParams
} from '@/pages/Main/hooks/persistence';

describe('readShareCodeFromHref', () => {
  it('share 쿼리 파라미터를 읽는다', () => {
    expect(readShareCodeFromHref(`https://snowball.app/?${SHARE_QUERY_PARAM}=ABC123`)).toBe('ABC123');
  });

  it('share가 없으면 null', () => {
    expect(readShareCodeFromHref('https://snowball.app/')).toBeNull();
    expect(readShareCodeFromHref('https://snowball.app/?other=1')).toBeNull();
  });

  it('URL 인코딩된 코드를 디코딩해 돌려준다', () => {
    expect(readShareCodeFromHref(`https://snowball.app/?${SHARE_QUERY_PARAM}=a%2Bb`)).toBe('a+b');
  });
});

describe('buildShareUrl', () => {
  it('현재 href에 share 코드를 붙인다', () => {
    expect(buildShareUrl('https://snowball.app/', 'CODE')).toBe(`https://snowball.app/?${SHARE_QUERY_PARAM}=CODE`);
  });

  it('기존 쿼리 파라미터는 유지한다', () => {
    const url = buildShareUrl('https://snowball.app/?utm=x', 'CODE');
    expect(url).toContain('utm=x');
    expect(readShareCodeFromHref(url)).toBe('CODE');
  });

  it('이미 share가 있으면 덮어쓴다', () => {
    const url = buildShareUrl(`https://snowball.app/?${SHARE_QUERY_PARAM}=OLD`, 'NEW');
    expect(readShareCodeFromHref(url)).toBe('NEW');
  });

  it('lz-string 코드가 왕복한다', () => {
    const code = 'N4IgLg9g+g==';
    expect(readShareCodeFromHref(buildShareUrl('https://snowball.app/', code))).toBe(code);
  });
});

describe('DB key 공유 (?s=)', () => {
  it('readDbShareKeyFromHref는 s 파라미터를 읽는다', () => {
    expect(readDbShareKeyFromHref(`https://snowball.app/?${S_QUERY_PARAM}=abc-DEF_123`)).toBe('abc-DEF_123');
  });

  it('s가 없으면 null (share만 있어도 null)', () => {
    expect(readDbShareKeyFromHref('https://snowball.app/')).toBeNull();
    expect(readDbShareKeyFromHref(`https://snowball.app/?${SHARE_QUERY_PARAM}=lz`)).toBeNull();
  });

  it('buildDbShareUrl은 href에 s 키를 붙이고 왕복한다', () => {
    const url = buildDbShareUrl('https://snowball.app/', 'KEY22');
    expect(url).toBe(`https://snowball.app/?${S_QUERY_PARAM}=KEY22`);
    expect(readDbShareKeyFromHref(url)).toBe('KEY22');
  });

  it('base64url 키(-, _)를 인코딩 없이 왕복한다', () => {
    const key = 'aZ0-9_bQ8xYt';
    expect(readDbShareKeyFromHref(buildDbShareUrl('https://snowball.app/', key))).toBe(key);
  });

  it('기존 쿼리 파라미터는 유지한다', () => {
    const url = buildDbShareUrl('https://snowball.app/?utm=x', 'KEY');
    expect(url).toContain('utm=x');
    expect(readDbShareKeyFromHref(url)).toBe('KEY');
  });

  it('두 포맷은 별개 파라미터라 공존한다 (감지는 이름으로)', () => {
    const href = `https://snowball.app/?${S_QUERY_PARAM}=KEY&${SHARE_QUERY_PARAM}=lz`;
    expect(readDbShareKeyFromHref(href)).toBe('KEY');
    expect(readShareCodeFromHref(href)).toBe('lz');
  });
});

/**
 * `/` 를 랜딩이 가져가는 시점에 루트 분기 래퍼가 쓸 함수. **소비처보다 계약을 먼저 잠근다** —
 * 이 판정이 조금만 좁아져도(파라미터 하나 누락, 유효성 필터 추가) 배포된 공유 링크가 조용히 죽는다.
 *
 * 기대값에 `SIMULATOR_PATH` 상수를 쓰지 않고 리터럴 `/simulator` 를 쓴다 — 상수를 그대로 쓰면
 * 동어반복이라 경로가 잘못 바뀌어도 통과한다.
 */
describe('resolveShareRedirectPath', () => {
  it('구 lz-string `?share=` 를 시뮬레이터로 보낸다', () => {
    expect(resolveShareRedirectPath('?share=N4IgLg')).toBe('/simulator?share=N4IgLg');
  });

  it('DB key `?s=` 도 보낸다', () => {
    expect(resolveShareRedirectPath('?s=abcdefghijklmnopqrstuv')).toBe('/simulator?s=abcdefghijklmnopqrstuv');
  });

  it('버전 파라미터 `?sv=` 하나만 있어도 보낸다 — 공유 파라미터는 셋이다', () => {
    expect(resolveShareRedirectPath('?sv=3')).toBe('/simulator?sv=3');
  });

  it('🔴 깨진 페이로드도 그대로 넘긴다 — 실패 배너를 띄우려면 시뮬레이터가 렌더돼야 한다', () => {
    expect(resolveShareRedirectPath('?share=zz')).toBe('/simulator?share=zz');
    // 값이 비어 있어도 "공유 링크로 왔다"는 사실은 같다.
    expect(resolveShareRedirectPath('?share=')).toBe('/simulator?share=');
  });

  it('검색어를 무손실로 옮긴다 — 순서·무관한 파라미터까지 그대로', () => {
    expect(resolveShareRedirectPath('?utm_source=kakao&share=CODE&sv=3')).toBe(
      '/simulator?utm_source=kakao&share=CODE&sv=3'
    );
  });

  it('공유 파라미터가 없으면 null — 과잉 발동 방지', () => {
    expect(resolveShareRedirectPath('?utm_source=kakao')).toBeNull();
    expect(resolveShareRedirectPath('?q=고배당')).toBeNull();
    expect(resolveShareRedirectPath('?')).toBeNull();
    expect(resolveShareRedirectPath('')).toBeNull();
  });

  it('이름이 겹치는 다른 파라미터에 반응하지 않는다', () => {
    expect(resolveShareRedirectPath('?shared=1&sort=asc&svg=1')).toBeNull();
  });

  it('`?` 없이 들어와도 붙여서 돌려준다', () => {
    expect(resolveShareRedirectPath('share=CODE')).toBe('/simulator?share=CODE');
  });
});

describe('stripShareParams', () => {
  it('share와 sv 파라미터를 제거한다', () => {
    const href = `https://snowball.app/?${SHARE_QUERY_PARAM}=CODE&${SHARE_VERSION_QUERY_PARAM}=3`;
    expect(stripShareParams(href)).toBe('https://snowball.app/');
  });

  it('신규 s 파라미터도 제거한다', () => {
    const href = `https://snowball.app/?${S_QUERY_PARAM}=KEY22`;
    expect(stripShareParams(href)).toBe('https://snowball.app/');
  });

  it('share·sv·s가 섞여 있어도 모두 제거한다', () => {
    const href = `https://snowball.app/?${S_QUERY_PARAM}=KEY&${SHARE_QUERY_PARAM}=CODE&${SHARE_VERSION_QUERY_PARAM}=3`;
    expect(stripShareParams(href)).toBe('https://snowball.app/');
  });

  it('다른 파라미터는 유지한다', () => {
    const href = `https://snowball.app/?utm=x&${SHARE_QUERY_PARAM}=CODE`;
    expect(stripShareParams(href)).toBe('https://snowball.app/?utm=x');
  });

  it('공유 파라미터가 없으면 그대로 둔다', () => {
    expect(stripShareParams('https://snowball.app/path?a=1')).toBe('https://snowball.app/path?a=1');
  });

  it('해시는 보존한다', () => {
    expect(stripShareParams(`https://snowball.app/?${SHARE_QUERY_PARAM}=CODE#result`)).toBe('https://snowball.app/#result');
  });
});
