import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { DIVIDEND_CALENDAR_COPY } from '../../copy';
import { ScheduleSourceBadge } from '.';

/**
 * 지급월 **근거 등급**을 사용자에게 전달하는 배지.
 *
 * 계약의 핵심은 "무엇을 그리는가"가 아니라 **언제 안 그리는가**다: 기본값(`pay`=실측)에는 아무것도
 * 달지 않는다(2026-07-26 결정 — 기본값에 배지를 달면 소음이다). 이 컴포넌트가 조용히 `pay` 배지를
 * 되살리면 캘린더 한 화면에 배지 수십 개가 깔린다.
 *
 * ⚠ 색·테두리(톤)는 여기서 단정하지 않는다 — Emotion 내부 구현 기반 테스트 금지 규칙(.cursor/rules §7).
 *   세 상태를 가르는 **의미는 언제나 텍스트**이므로(컴포넌트 주석과 같은 원칙) 텍스트로 못 박는다.
 */

const copy = DIVIDEND_CALENDAR_COPY;

describe('ScheduleSourceBadge', () => {
  it('실측(pay)에는 배지를 그리지 않는다 (기본값 무표기)', () => {
    const { container } = render(createElement(ScheduleSourceBadge, { source: 'pay' }));

    expect(container).toBeEmptyDOMElement();
    // 다른 상태의 문구가 새어 나오지 않는지도 함께 본다.
    expect(screen.queryByText(copy.badge.ex)).toBeNull();
    expect(screen.queryByText(copy.badge.unavailable)).toBeNull();
    expect(screen.queryByText(copy.badge.nonDividend)).toBeNull();
  });

  it('배당락 기반(ex)은 "추정"으로 표기한다', () => {
    render(createElement(ScheduleSourceBadge, { source: 'ex' }));

    expect(screen.getByText(copy.badge.ex)).toBeInTheDocument();
    expect(screen.getByText(copy.badge.ex).textContent).toBe('추정');
  });

  it('지급월 데이터가 없으면(null) "데이터 준비 중"으로 표기한다', () => {
    render(createElement(ScheduleSourceBadge, { source: null }));

    expect(screen.getByText(copy.badge.unavailable)).toBeInTheDocument();
    expect(screen.getByText(copy.badge.unavailable).textContent).toBe('데이터 준비 중');
  });

  it('배당을 지급하지 않는 종목(nonDividend)은 "배당 없음"으로 표기한다', () => {
    render(createElement(ScheduleSourceBadge, { source: 'nonDividend' }));

    expect(screen.getByText(copy.badge.nonDividend)).toBeInTheDocument();
    expect(screen.getByText(copy.badge.nonDividend).textContent).toBe('배당 없음');
    // "준비 중"으로 읽히면 사용자는 오지 않을 데이터를 계속 기다린다(실제 신고).
    expect(screen.queryByText(copy.badge.unavailable)).toBeNull();
  });

  /**
   * 세 배지는 서로 다른 상태다:
   * "추정" = 근거는 있음 / "데이터 준비 중" = **아직** 근거 없음 / "배당 없음" = 근거를 물을 수 없음.
   * 문구가 하나로 합쳐지면 사용자가 상태를 구별할 방법이 사라진다 — 색은 보조일 뿐이다.
   */
  it('세 문구가 모두 서로 다르다 (색이 아니라 텍스트가 상태를 가른다)', () => {
    const labels = [copy.badge.ex, copy.badge.unavailable, copy.badge.nonDividend];

    expect(new Set(labels).size).toBe(labels.length);
  });
});
