import { buildDownloadFileName, formatSavedNameTimestamp, sanitizeDownloadFileName } from '@/pages/Main/hooks/persistence';

describe('formatSavedNameTimestamp', () => {
  it('YYYY-MM-DD HH:mm:ss 형식으로 만든다', () => {
    expect(formatSavedNameTimestamp(new Date(2024, 0, 2, 3, 4, 5))).toBe('2024-01-02 03:04:05');
  });

  it('두 자리로 zero padding 한다', () => {
    expect(formatSavedNameTimestamp(new Date(2024, 11, 31, 23, 59, 59))).toBe('2024-12-31 23:59:59');
  });

  it('같은 Date에 대해 항상 같은 결과 (결정적)', () => {
    const date = new Date(2030, 5, 15, 12, 30, 0);
    expect(formatSavedNameTimestamp(date)).toBe(formatSavedNameTimestamp(date));
  });
});

describe('sanitizeDownloadFileName', () => {
  it('파일명에 쓸 수 없는 문자를 _로 바꾼다', () => {
    expect(sanitizeDownloadFileName('a/b\\c:d*e?f"g<h>i|j')).toBe('a_b_c_d_e_f_g_h_i_j');
  });

  it('앞뒤 공백을 제거한다', () => {
    expect(sanitizeDownloadFileName('  내 포트폴리오  ')).toBe('내 포트폴리오');
  });

  it('안전한 이름은 그대로 둔다', () => {
    expect(sanitizeDownloadFileName('2024-01-02 03:04:05'.replace(/:/g, '-'))).toBe('2024-01-02 03-04-05');
  });
});

describe('buildDownloadFileName', () => {
  it('정리된 이름에 .json을 붙인다', () => {
    expect(buildDownloadFileName('내 저장')).toBe('내 저장.json');
  });

  it('불가 문자를 치환한 뒤 확장자를 붙인다', () => {
    expect(buildDownloadFileName('2024-01-02 03:04:05')).toBe('2024-01-02 03_04_05.json');
  });

  it('이름이 비면 portfolio.json으로 폴백한다', () => {
    expect(buildDownloadFileName('')).toBe('portfolio.json');
    expect(buildDownloadFileName('   ')).toBe('portfolio.json');
  });

  it('불가 문자만으로 이뤄진 이름은 치환되어 폴백하지 않는다', () => {
    expect(buildDownloadFileName('///')).toBe('___.json');
  });
});
