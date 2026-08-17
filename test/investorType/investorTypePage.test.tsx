// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import InvestorTypePage from '@/pages/InvestorType/InvestorTypePage/InvestorTypePage';
import { INVESTOR_AXES, INVESTOR_QUESTIONS, INVESTOR_TYPE_PROFILES } from '@/shared/constants/investorType';
import { storageKey } from '@/shared/lib/storage';

/**
 * 투자 성향 테스트 화면 — **사용자 행동 기반**으로만 본다(className·Emotion 내부 금지, 레포 규율).
 *
 * 여기서 지키는 계약은 넷이다:
 *  1. 12문항을 답하면 결과에 **도달한다** — 흐름이 중간에 끊기지 않는다.
 *  2. 결과는 **주소에 실린다** — 그래야 공유·새로고침이 성립한다.
 *  3. 이전 문항이 **답을 되돌린다** — 잘못 눌렀을 때 빠져나갈 길.
 *  4. 진행 중 답안이 **남는다** — 12문항짜리 흐름에서 새로고침이 사고가 되지 않게.
 */

const ANSWERS_KEY = storageKey('investor-type:answers:v1');

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <InvestorTypePage />
    </MemoryRouter>
  );

/**
 * 지금 화면의 n번째 선택지를 고른다.
 *
 * ⚠ 버튼을 순서로 집지 않는다 — 화면 껍데기(헤더 등)의 버튼까지 섞여 들어와 조용히 엉뚱한 것을
 *   누른다. **문항 데이터의 라벨**로 집으면 그 위험이 없다.
 */
const pick = async (questionIndex: number, optionIndex: number) => {
  const label = INVESTOR_QUESTIONS[questionIndex].options[optionIndex].label;
  await userEvent.click(screen.getByRole('button', { name: label }));
};

beforeEach(() => {
  window.localStorage.clear();
});

describe('문항 화면', () => {
  it('첫 문항과 진행률을 보여 준다', () => {
    renderAt('/investor-type');

    expect(screen.getByText(INVESTOR_QUESTIONS[0].question)).toBeTruthy();
    expect(screen.getByText(`1 / ${INVESTOR_QUESTIONS.length}`)).toBeTruthy();
  });

  it('첫 문항에는 "이전 문항"이 없다 — 돌아갈 곳이 없다', () => {
    renderAt('/investor-type');
    expect(screen.queryByText(/이전 문항/)).toBeNull();
  });

  it('고르면 곧바로 다음 문항으로 넘어간다 (확인 버튼을 한 번 더 누르지 않는다)', async () => {
    renderAt('/investor-type');

    await pick(0, 0);

    expect(screen.getByText(INVESTOR_QUESTIONS[1].question)).toBeTruthy();
    expect(screen.getByText(new RegExp(`2 / ${INVESTOR_QUESTIONS.length}`))).toBeTruthy();
  });

  it('"이전 문항"이 직전 답을 되돌린다', async () => {
    renderAt('/investor-type');

    await pick(0, 0);
    await userEvent.click(screen.getByText(/이전 문항/));

    expect(screen.getByText(INVESTOR_QUESTIONS[0].question)).toBeTruthy();
    expect(screen.getByText(`1 / ${INVESTOR_QUESTIONS.length}`)).toBeTruthy();
  });

  it('진행 중 답안이 저장돼, 다시 들어와도 답한 자리에서 이어진다', async () => {
    const first = renderAt('/investor-type');
    await pick(0, 0);
    await pick(1, 0);
    first.unmount();

    // 새로고침을 흉내낸다 — 저장된 답안만 남고 컴포넌트는 처음부터 마운트된다.
    renderAt('/investor-type');

    expect(screen.getByText(INVESTOR_QUESTIONS[2].question)).toBeTruthy();
    expect(screen.getByText(new RegExp(`3 / ${INVESTOR_QUESTIONS.length}`))).toBeTruthy();
  });

  it('손상된 저장값은 조용히 무시하고 첫 문항에서 시작한다', () => {
    // 하위 호환 규율 — 저장값이 깨졌다고 화면이 죽으면 안 된다.
    window.localStorage.setItem(ANSWERS_KEY, '{{{ not json');

    expect(() => renderAt('/investor-type')).not.toThrow();
    expect(screen.getByText(INVESTOR_QUESTIONS[0].question)).toBeTruthy();
  });
});

describe('12문항 완주', () => {
  it('전부 답하면 결과 화면에 도달하고 저장된 답안이 정리된다', async () => {
    renderAt('/investor-type');

    // 전부 첫 선택지 = 모든 축 0 → 집중 가치형 쪽 좌표.
    for (let index = 0; index < INVESTOR_QUESTIONS.length; index += 1) await pick(index, 0);

    // 결과 화면의 표식(모든 유형이 갖는 패널 제목)으로 도달을 확인한다.
    expect(screen.getByText('네 축에서 어디쯤인가')).toBeTruthy();
    // 🔴 완주 후에는 진행 중 답안을 남기지 않는다 — 남으면 "다시 해보기"가 곧장 결과로 튄다.
    expect(window.localStorage.getItem(ANSWERS_KEY)).toBeNull();
  });
});

describe('결과 화면', () => {
  /** 유형 코드를 직접 실어 결과를 연다 — 12번 클릭하지 않고 각 유형을 볼 수 있다. */
  const openResult = (code: string, scores = '10-20-30-40') => renderAt(`/investor-type?t=${code}&s=${scores}`);

  it('유형 이름과 정의를 보여 준다', () => {
    openResult('cv');

    const profile = INVESTOR_TYPE_PROFILES.find((candidate) => candidate.id === 'concentrated-value')!;
    expect(screen.getByText(profile.name)).toBeTruthy();
    expect(screen.getByText(profile.tagline)).toBeTruthy();
  });

  it('네 축을 낭독기가 읽을 수 있는 형태로 준다', () => {
    openResult('cv', '10-20-30-40');

    /**
     * ⚠ 전역으로 `role="img"` 를 세지 마라 — 구성 비중 막대도 같은 역할을 갖는다(2026-08-18 UI 개선).
     *   축 패널 **안으로** 좁혀야 이 단정이 축만 본다.
     */
    const panel = screen.getByText('네 축에서 어디쯤인가').closest('section')!;
    const axes = within(panel).getAllByRole('img');
    expect(axes).toHaveLength(4);
    expect(axes[0].getAttribute('aria-label')).toContain('10');
  });

  it('🔴 네 축의 이름을 화면에 쓴다 — 양 끝 라벨만으로는 무엇을 재는지 알 수 없다', () => {
    openResult('cv');

    const panel = screen.getByText('네 축에서 어디쯤인가').closest('section')!;
    for (const axis of INVESTOR_AXES) {
      expect(within(panel).getByText(axis.label), axis.label).toBeTruthy();
    }
  });

  it('구성 비중을 막대와 목록 양쪽으로 준다', () => {
    openResult('cv');

    // 막대는 한눈에, 목록은 정확한 값으로 — 숫자만 있으면 무엇이 주인공인지 눈으로 더해야 한다.
    const bar = screen.getByLabelText(/구성 비중:/);
    expect(bar.getAttribute('aria-label')).toContain('SCHD 30%');
    expect(screen.getByText('SCHD')).toBeTruthy();
  });

  it('공시로 뒷받침되는 유형은 닮은 투자자를 근거와 함께 보여 준다', () => {
    openResult('cv');

    const panel = screen.getByText('공시에서 비슷한 모습을 보이는 투자자').closest('section')!;
    expect(within(panel).getByText('워런 버핏')).toBeTruthy();
    // 🔴 근거는 공시에서 읽히는 숫자여야 한다(인상 비평 금지).
    expect(within(panel).getByText(/29종/)).toBeTruthy();
  });

  it('🔴 대가를 댈 수 없는 유형은 그 패널을 통째로 비운다', () => {
    /**
     * 13F 는 "이 사람은 월 현금흐름을 노린다"를 말하지 않는다. 빈 자리를 채우려 들면 데이터가
     * 말하지 않는 것을 말하게 된다 — 그래서 패널 자체가 나오지 않는 것이 정상이다.
     */
    openResult('mi');

    expect(screen.queryByText('공시에서 비슷한 모습을 보이는 투자자')).toBeNull();
  });

  it('구성 예시에서 계산기로 가는 링크가 프리셋 id 를 싣는다', () => {
    openResult('cv');

    const link = screen.getByText(/이 구성으로 계산해 보기/).closest('a')!;
    // 이 쿼리를 시뮬레이터의 usePresetQueryApply 가 읽는다 — 흐름의 착지점이다.
    expect(link.getAttribute('href')).toBe('/simulator?preset=warren-buffett-style');
  });

  it('투자 자문이 아니라는 고지를 항상 붙인다', () => {
    openResult('cv');
    expect(screen.getByText(/투자 자문이 아닙니다/)).toBeTruthy();
  });

  it('모르는 유형 코드는 결과가 아니라 문항으로 떨어진다', () => {
    // 구버전·손상 링크. 죽은 화면을 보여 주느니 처음부터 하게 한다.
    openResult('zz');

    expect(screen.getByText(INVESTOR_QUESTIONS[0].question)).toBeTruthy();
  });
});
