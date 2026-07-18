import {
  buildDbShareUrl,
  buildShareUrl,
  readDbShareKeyFromHref,
  readShareCodeFromHref,
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
