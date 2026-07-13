import {
  buildShareUrl,
  readShareCodeFromHref,
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

describe('stripShareParams', () => {
  it('share와 sv 파라미터를 제거한다', () => {
    const href = `https://snowball.app/?${SHARE_QUERY_PARAM}=CODE&${SHARE_VERSION_QUERY_PARAM}=3`;
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
