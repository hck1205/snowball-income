// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import {
  CALENDAR_TICKERS_PARAM,
  getCalendarUniverse,
  parseCalendarTickersParam,
  serializeCalendarTickersParam
} from '@/pages/DividendCalendar/utils';

const universe = getCalendarUniverse();

describe('serializeCalendarTickersParam', () => {
  it('쉼표로 이어붙인다', () => {
    expect(serializeCalendarTickersParam(['SCHD', 'JEPI', 'O'])).toBe('SCHD,JEPI,O');
  });

  it('빈 선택은 빈 문자열', () => {
    expect(serializeCalendarTickersParam([])).toBe('');
  });

  it('대문자로 정규화하고 중복·공백을 정리한다', () => {
    expect(serializeCalendarTickersParam([' schd ', 'SCHD', 'o', ''])).toBe('SCHD,O');
  });
});

describe('parseCalendarTickersParam', () => {
  it('직렬화한 값을 그대로 되읽는다 (왕복)', () => {
    const selected = ['SCHD', 'JEPI', 'O'];
    const search = `?${CALENDAR_TICKERS_PARAM}=${serializeCalendarTickersParam(selected)}`;

    expect(parseCalendarTickersParam(search, universe)).toEqual(selected);
  });

  it('URLSearchParams 로 만든 링크(쉼표가 %2C 로 인코딩됨)도 읽는다', () => {
    const params = new URLSearchParams();
    params.set(CALENDAR_TICKERS_PARAM, serializeCalendarTickersParam(['SCHD', 'O']));

    expect(params.toString()).toContain('%2C');
    expect(parseCalendarTickersParam(`?${params.toString()}`, universe)).toEqual(['SCHD', 'O']);
  });

  it('소문자·공백 입력을 대문자로 정규화한다', () => {
    expect(parseCalendarTickersParam('?tickers=schd, jepi ,o', universe)).toEqual(['SCHD', 'JEPI', 'O']);
  });

  it('중복은 제거하고 처음 등장한 순서를 지킨다', () => {
    expect(parseCalendarTickersParam('?tickers=O,SCHD,o,SCHD', universe)).toEqual(['O', 'SCHD']);
  });

  it('유니버스에 없는 심볼은 버린다', () => {
    expect(parseCalendarTickersParam('?tickers=SCHD,NOTATICKER,O', universe)).toEqual(['SCHD', 'O']);
  });

  it('파라미터가 없거나 비어 있으면 빈 배열', () => {
    expect(parseCalendarTickersParam('', universe)).toEqual([]);
    expect(parseCalendarTickersParam('?', universe)).toEqual([]);
    expect(parseCalendarTickersParam('?tickers=', universe)).toEqual([]);
    expect(parseCalendarTickersParam('?tickers=,,', universe)).toEqual([]);
  });

  it('다른 쿼리 파라미터와 공존한다 (앞·뒤 어디에 있든)', () => {
    expect(parseCalendarTickersParam('?utm_source=kakao&tickers=SCHD&view=list', universe)).toEqual(['SCHD']);
    expect(parseCalendarTickersParam('utm_source=kakao&tickers=SCHD', universe)).toEqual(['SCHD']);
  });

  it('tickers 없이 다른 파라미터만 있으면 빈 배열', () => {
    expect(parseCalendarTickersParam('?utm_source=kakao', universe)).toEqual([]);
  });

  it('지급월 데이터가 없는 종목도 유니버스에 있으므로 선택은 유지된다 (달력에서만 빠진다)', () => {
    expect(parseCalendarTickersParam('?tickers=ANET', universe)).toEqual(['ANET']);
  });
});
