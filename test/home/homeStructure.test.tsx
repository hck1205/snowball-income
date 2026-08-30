// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LANDING_ASSET_GOALS, LANDING_DIVIDEND_GOALS, LANDING_GOALS } from '@/shared/constants/landingGoals';
import { HOME_COPY } from '@/pages/Home/copy';
import { ABOUT_PATH } from '@/shared/constants/routes';
import { renderHomePage, setWorkspaceMarker } from './homeHarness';

/**
 * 첫 화면(`/`)이 **약속하는 것**.
 *
 * 2026-08-27 에 이 주소의 화면이 통째로 바뀌었다(여섯 장짜리 안내문 → 목표 여섯). 그 교체가 무엇을
 * 위한 것이었는지를 여기서 잠근다 — 다음 사람이 "설명을 조금만 되돌려 놓자"고 할 때 빨개져야 한다.
 *
 * 🔴 사용자 행동으로만 단정한다. className·Emotion 내부 구현은 보지 않는다(.cursor/rules).
 */

beforeEach(() => {
  setWorkspaceMarker(false);
});

afterEach(() => {
  setWorkspaceMarker(false);
});

describe('목표 여섯', () => {
  it('여섯 개가 전부 링크로 있다 — 하나라도 빠지면 고를 수 없는 목표가 생긴다', () => {
    renderHomePage();

    /* ⚠ 라벨 문자열로 찾지 않는다. 자산 카드의 조건절("월 100만원씩")이 배당 라벨("월 100만원")을
       포함해서 이름 검색이 두 장을 함께 집는다 — 안정 앵커는 `data-home-goal` 이다. */
    for (const goal of LANDING_GOALS) {
      const card = document.querySelector(`[data-home-goal="${goal.id}"]`);
      expect(card).not.toBeNull();
      expect(card?.tagName).toBe('A');
      expect(card?.textContent).toContain(goal.label);
    }
  });

  it('🔴 여섯을 넘지 않는다 — 개수가 늘면 "한눈에 훑고 고른다"가 무너진다', () => {
    renderHomePage();

    const goalLinks = document.querySelectorAll('[data-home-goal]');
    expect(goalLinks).toHaveLength(6);
  });

  it('자산과 배당이 각각 자기 묶음에 산다', () => {
    renderHomePage();

    const assetGroup = screen.getByRole('heading', { name: new RegExp(HOME_COPY.groups.asset.label) })
      .closest('section');
    const dividendGroup = screen.getByRole('heading', { name: new RegExp(HOME_COPY.groups.dividend.label) })
      .closest('section');

    expect(assetGroup).not.toBeNull();
    expect(dividendGroup).not.toBeNull();

    for (const goal of LANDING_ASSET_GOALS) {
      expect((assetGroup as HTMLElement).querySelector(`[data-home-goal="${goal.id}"]`)).not.toBeNull();
    }
    for (const goal of LANDING_DIVIDEND_GOALS) {
      expect((dividendGroup as HTMLElement).querySelector(`[data-home-goal="${goal.id}"]`)).not.toBeNull();
    }
    // 🔴 서로의 묶음에 섞여 있지 않다 — 자산 칸에 배당이 끼면 두 줄의 뜻이 무너진다.
    for (const goal of LANDING_DIVIDEND_GOALS) {
      expect((assetGroup as HTMLElement).querySelector(`[data-home-goal="${goal.id}"]`)).toBeNull();
    }
  });

  it('🔴 목표마다 계산기로 자기 id 를 실어 보낸다 — 안 그러면 고른 것이 도착지에서 사라진다', () => {
    renderHomePage();

    for (const goal of LANDING_GOALS) {
      const link = document.querySelector(`[data-home-goal="${goal.id}"]`);
      expect(link?.getAttribute('href')).toBe(`/simulator?goal=${goal.id}`);
    }
  });

  it('🔴 카드가 답을 미리 말한다 — 라벨만 있는 버튼은 링크지 후킹이 아니다', () => {
    renderHomePage();

    // 자산은 "얼마나 걸리는지", 배당은 "얼마가 필요한지"를 답한다.
    for (const goal of LANDING_ASSET_GOALS) {
      const card = document.querySelector(`[data-home-goal="${goal.id}"]`);
      expect(card?.textContent).toMatch(/\d+년|\d+개월/);
    }
    for (const goal of LANDING_DIVIDEND_GOALS) {
      const card = document.querySelector(`[data-home-goal="${goal.id}"]`);
      expect(card?.textContent).toMatch(/억 원/);
    }
  });

  it('🔴 계산 가정 셋을 함께 밝힌다 — 근거 없는 숫자는 투자 권유로 읽힌다', () => {
    renderHomePage();

    /* 가정은 라벨 + 칩 셋으로 갈라져 있다(한 문장이면 "하나도 안 읽힌다" — 2026-08-27 지적).
       그래서 카드 전체를 훑는다: 이름과 값이 **함께** 보여야 근거가 된다. */
    const card = screen.getByText(new RegExp(HOME_COPY.assumptionsPrefix)).closest('aside');
    expect(card).not.toBeNull();

    const text = (card as HTMLElement).textContent ?? '';
    for (const label of ['연 수익률', '배당률', '배당소득세']) {
      expect(text).toContain(label);
    }
    // 이름만 있고 값이 없으면 근거가 아니다 — 퍼센트가 셋 다 보인다.
    expect(text.match(/\d+(\.\d+)?%/g) ?? []).toHaveLength(3);
  });
});

describe('출구', () => {
  it('🔴 여섯 중 자기 것이 없는 사람에게 갈 곳을 준다', async () => {
    renderHomePage();

    const exit = screen.getByRole('link', { name: new RegExp(HOME_COPY.browse.action) });
    expect(exit).toHaveAttribute('href', ABOUT_PATH);
    // 목표를 고르는 것이 의무가 아님을 말하는 자리라, 그 리드도 함께 있어야 한다.
    expect(screen.getByText(new RegExp(HOME_COPY.browse.lede))).toBeInTheDocument();
    await Promise.resolve();
  });
});

describe('곁길 셋의 자리', () => {
  it('🔴 성향 테스트가 둘러보기보다 **앞**에 온다 — 한쪽은 답을 주고 한쪽은 읽을 거리를 준다', () => {
    setWorkspaceMarker(true);
    renderHomePage();

    const cards = Array.from(document.querySelectorAll('[data-home-cta]'));
    expect(cards.map((card) => card.getAttribute('data-home-cta'))).toEqual([
      'investor-type',
      'about',
      'resume'
    ]);
  });

  it('🔴 목표 여섯보다 **뒤**에 온다 — 곁길이 먼저 눈에 걸리면 목표 화면을 만든 뜻이 사라진다', () => {
    renderHomePage();

    const firstGoal = document.querySelector('[data-home-goal]');
    const firstExtra = document.querySelector('[data-home-cta]');
    expect(firstGoal).not.toBeNull();
    expect(firstExtra).not.toBeNull();
    // DOM 순서 = 화면 순서(이 지면은 요소를 재배치하지 않는다).
    expect(firstGoal!.compareDocumentPosition(firstExtra!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('이 화면이 하지 않는 일', () => {
  it('🔴 설명 섹션을 그리지 않는다 — 그 문서는 `/about` 이 맡는다', () => {
    renderHomePage();

    /*
     * 안내문의 장 제목들이 여기 있으면 첫 화면이 다시 길어졌다는 뜻이다. 목표 여섯이 접힘 아래로
     * 내려가는 순간 이 교체는 아무것도 바꾸지 않은 것이 된다.
     */
    for (const chapterTitle of ['배당을 알기 전에', '자주 묻는 질문', '실제 투자 전에']) {
      expect(screen.queryByText(new RegExp(chapterTitle))).toBeNull();
    }
  });

  it('🔴 모달을 열지 않는다', () => {
    renderHomePage();

    expect(screen.queryAllByRole('dialog')).toHaveLength(0);
  });

  it('문서의 h1 은 하나다', () => {
    renderHomePage();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(HOME_COPY.hero.title);
  });
});

describe('재방문 마커', () => {
  it('저장된 작업이 없으면 "이어서 계산하기"가 없다', () => {
    setWorkspaceMarker(false);
    renderHomePage();

    expect(screen.queryByRole('button', { name: new RegExp(HOME_COPY.resume.action) })).toBeNull();
  });

  it('저장된 작업이 있으면 이어서 갈 수 있다', async () => {
    setWorkspaceMarker(true);
    renderHomePage();

    /* ⚠ 접근 가능한 이름에는 상황 줄("전에 계산하던 내용이…")과 행동 줄이 **함께** 들어간다 —
       카드 한 장이 둘을 품기 때문이다. 그래서 정확 일치가 아니라 부분 일치로 찾는다. */
    const resume = screen.getByRole('button', { name: new RegExp(HOME_COPY.resume.action) });
    expect(resume).toBeInTheDocument();
    // 상황 줄도 같은 카드 안에 있어야 "무엇을 이어서 하는지"가 전달된다.
    expect(resume.textContent).toContain(HOME_COPY.resume.notice);
    await userEvent.click(resume);
  });
});
