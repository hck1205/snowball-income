import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  KOREA_ASSEMBLY_STOCKS,
  formatShares,
  isSelfOnly
} from '@/shared/constants/koreaAssemblyStocks';
import { KOREA_ASSEMBLY_COPY } from '@/pages/KoreaAssembly/copy';
import { buildKoreaAssemblyViewModel, formatKoreanDate, formatMemberSample } from '@/pages/KoreaAssembly/utils';
import KoreaAssemblyView from '@/pages/KoreaAssembly/KoreaAssemblyPage/KoreaAssemblyPage.view';

/**
 * 대한민국 국회의원 주식 보유 스냅샷의 **규율**을 잠근다.
 *
 * 이 화면이 조용히 거짓말을 시작하는 경로는 셋이고, 셋 다 여기서 막는다:
 *  ① 주식 수를 금액처럼 다루기 — 공보에 종목별 금액이 **없다**. 스키마에 금액 필드가 생기면 실패한다.
 *  ② 0주(전량 매도)를 보유로 세기 — 팔아 치운 것을 들고 있다고 말하게 된다.
 *  ③ 가족 명의를 의원 본인 것처럼 보이기 — 관계가 화면에서 사라지면 실패한다.
 */

const snapshot = KOREA_ASSEMBLY_STOCKS;

const renderView = () =>
  render(
    <MemoryRouter>
      <KoreaAssemblyView viewModel={buildKoreaAssemblyViewModel(snapshot)} />
    </MemoryRouter>
  );

describe('국회의원 주식 보유 스냅샷', () => {
  it('기준일은 공개일보다 앞선 전년 12월 31일이다', () => {
    /* 🔴 이 화면에서 가장 오해받기 쉬운 값 — 공개일(3월)을 기준일로 읽으면 자료가 석 달 젊어 보인다. */
    expect(snapshot.asOfDate < snapshot.publishedAt).toBe(true);
    const publishedYear = Number(snapshot.publishedAt.slice(0, 4));
    expect(snapshot.asOfDate).toBe(`${publishedYear - 1}-12-31`);
  });

  it('집계 범위가 서로 모순되지 않는다', () => {
    const { peopleTotal, membersTotal, membersWithStocks } = snapshot.coverage;
    /* 공보에는 의원 아닌 국회 고위공직자도 실린다 — 의원 수가 전체를 넘을 수 없다. */
    expect(membersTotal).toBeLessThanOrEqual(peopleTotal);
    /* 주식을 신고한 의원은 전체 의원의 부분집합이다. */
    expect(membersWithStocks).toBeLessThanOrEqual(membersTotal);
    expect(membersTotal).toBeGreaterThan(0);
  });

  it('보유 종목에 금액 필드가 없다', () => {
    /* 🔴 공보는 증권을 소계로만 적는다. 금액 필드가 생겼다는 건 어딘가에서 지어냈다는 뜻이다. */
    const keys = Object.keys(snapshot.topIssuers[0]);
    expect(keys).toEqual(expect.arrayContaining(['issuer', 'memberCount', 'shares']));
    for (const forbidden of ['value', 'valueKrw', 'amount', 'price', 'krw', 'won']) {
      expect(keys).not.toContain(forbidden);
    }
  });

  it('0주는 보유로 세지 않는다', () => {
    for (const row of snapshot.topIssuers) {
      expect(row.shares).toBeGreaterThan(0);
      expect(row.memberCount).toBeGreaterThan(0);
    }
  });

  it('종목은 신고한 의원 수 내림차순이다', () => {
    const counts = snapshot.topIssuers.map((row) => row.memberCount);
    expect([...counts].sort((left, right) => right - left)).toEqual(counts);
  });

  it('의원 이름 표본은 전체 수를 넘지 않는다', () => {
    /* `members` 는 표본(최대 6명)이라 `memberCount` 보다 많을 수 없다 — 많으면 집계가 깨진 것이다. */
    for (const row of snapshot.topIssuers) {
      expect(row.members.length).toBeLessThanOrEqual(row.memberCount);
    }
  });

  it('티커가 붙은 종목은 미국 티커 형식이다', () => {
    for (const row of snapshot.topIssuers) {
      if (row.ticker === null) continue;
      expect(row.ticker).toMatch(/^[A-Z][A-Z.]{0,5}$/);
    }
  });
});

describe('표시 규칙', () => {
  it('주식 수는 "주"로만 말하고 금액으로 바꾸지 않는다', () => {
    expect(formatShares(1234)).toBe('1,234주');
    /* 소수점 매수 때문에 정수가 아닐 수 있다 — 두 자리까지만 보여 준다. */
    expect(formatShares(3.14159)).toBe('3.14주');
    expect(formatShares(1234)).not.toMatch(/원|달러|\$/);
  });

  it('기준일은 연도까지 다 쓴다', () => {
    /* `12월 31일`처럼 연도를 빼면 "올해 것"으로 읽힌다 — 이 자료의 나이가 사라진다. */
    expect(formatKoreanDate('2025-12-31')).toBe('2025년 12월 31일');
  });

  it('의원 표본은 남은 인원을 "외 N명"으로 밝힌다', () => {
    expect(formatMemberSample(['가', '나'], 5)).toBe('가, 나 외 3명');
    expect(formatMemberSample(['가', '나'], 2)).toBe('가, 나');
  });

  it('본인 명의만인지 가린다', () => {
    expect(isSelfOnly(['본인'])).toBe(true);
    expect(isSelfOnly(['본인', '배우자'])).toBe(false);
    /* 모르는 것을 본인으로 단정하지 않는다. */
    expect(isSelfOnly([])).toBe(false);
  });
});

describe('화면', () => {
  it('한계 안내가 여섯 가지를 전부 말한다', () => {
    renderView();
    expect(screen.getByRole('heading', { name: KOREA_ASSEMBLY_COPY.limits.heading })).toBeInTheDocument();
    expect(KOREA_ASSEMBLY_COPY.limits.items).toHaveLength(6);
  });

  it('명의(본인·배우자)를 표에 그대로 드러낸다', () => {
    /* 🔴 가족 명의를 감추면 "의원이 샀다"로 읽힌다 — 이 자료에서 가장 흔한 오해다. */
    renderView();
    const relations = new Set(buildKoreaAssemblyViewModel(snapshot).members.flatMap((row) => [...row.relations]));
    for (const relation of relations) {
      expect(screen.getAllByText(relation).length).toBeGreaterThan(0);
    }
  });

  it('미국 화면으로 건너가는 길을 준다', () => {
    renderView();
    expect(screen.getByRole('link', { name: KOREA_ASSEMBLY_COPY.usa.linkLabel })).toHaveAttribute(
      'href',
      '/portfolio/congress'
    );
  });

  it('원문 공보로 나가는 링크가 있다', () => {
    renderView();
    expect(screen.getByRole('link', { name: KOREA_ASSEMBLY_COPY.source.linkLabel })).toHaveAttribute(
      'href',
      expect.stringContaining('assembly.go.kr')
    );
  });
});
