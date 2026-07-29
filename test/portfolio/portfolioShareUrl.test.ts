import { describe, expect, it } from 'vitest';
import {
  PORTFOLIO_CALENDAR_TICKERS_PARAM,
  buildPortfolioCalendarPath,
  serializePortfolioCalendarTickers
} from '@/pages/Portfolio/utils';
import { CALENDAR_TICKERS_PARAM, getCalendarUniverse, parseCalendarTickersParam } from '@/pages/DividendCalendar/utils';

/**
 * 캘린더 딥링크 **포맷 미러링**의 왕복 검증.
 *
 * 포트폴리오는 캘린더 모듈을 import 하지 않고(페이지 간 결합 금지) 같은 포맷을 자기 파일에 복제한다.
 * 복제는 언젠가 갈리므로, **여기서만** 양쪽을 함께 import 해 "보낸 값을 캘린더가 그대로 읽는다"를
 * 못 박는다(테스트는 페이지가 아니라 계약을 검증하는 자리다).
 */

describe('캘린더 딥링크', () => {
  it('파라미터 이름이 캘린더와 같다', () => {
    expect(PORTFOLIO_CALENDAR_TICKERS_PARAM).toBe(CALENDAR_TICKERS_PARAM);
  });

  it('대문자 정규화·중복 제거·입력 순서 보존', () => {
    expect(serializePortfolioCalendarTickers(['schd', 'JEPI', 'schd', '  o  '])).toBe('SCHD,JEPI,O');
    expect(serializePortfolioCalendarTickers([])).toBe('');
  });

  it('보낸 목록을 캘린더가 그대로 읽는다', () => {
    const tickers = ['SCHD', 'JEPI', 'O'];
    const path = buildPortfolioCalendarPath(tickers);
    const search = path.slice(path.indexOf('?'));

    expect(parseCalendarTickersParam(search, getCalendarUniverse())).toEqual(tickers);
  });

  it('실을 종목이 없으면 파라미터를 붙이지 않는다', () => {
    expect(buildPortfolioCalendarPath([])).toBe('/dividend/calendar');
  });
});

/*
 * 수량 소수 자릿수(`QUANTITY_INPUT_DECIMALS` ↔ `PORTFOLIO_QUANTITY_DECIMALS`) 대조는
 * 위젯 옆으로 옮겼다 — `components/common/QuantityInput/QuantityInput.test.ts`.
 * 상수를 복제한 파일 바로 옆에 단정이 있어야 그 파일만 보고도 제약을 안다.
 */
