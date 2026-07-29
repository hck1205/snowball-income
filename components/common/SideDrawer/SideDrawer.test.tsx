import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { restoreMatchMedia, stubViewportWidth } from '@/test';
import SideDrawer from './SideDrawer';

/**
 * 드로어의 **통합 계약**을 사용자 행동으로 검증한다. 여기서 지키는 것들은 하나라도 빠지면
 * 키보드/스크린리더 사용자가 화면을 잃거나(포커스), 입력이 조용히 날아가거나(언마운트),
 * 페이지 스크롤이 영구히 잠긴다 — 전부 과거에 실제로 났던 사고다.
 *
 * jsdom 은 `@media` 를 평가하지 않으므로 **딤/스크롤락의 폭 분기는 `matchMedia` 스텁**으로만
 * 검증할 수 있다(전역 스텁 기본값은 `matches: false` = 넓은 화면 = 딤 없음, test/setup.ts).
 */

const INITIAL_HREF = window.location.href;

/** 딤·스크롤락 경계는 `drawer`(960)다 — 그 아래위 두 폭을 다 태운다. */
const NARROW = 360;
const WIDE = 1440;

/** jsdom 의 `history.back()` 은 비동기 태스크라 popstate 가 다음 틱에 온다. */
async function goBack() {
  window.history.back();
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/** 이펙트 정리에서 비동기로 날아오는 `history.back()`·popstate 까지 가라앉힌다. */
async function settle() {
  await new Promise((resolve) => {
    setTimeout(resolve, 30);
  });
}

afterEach(async () => {
  await settle();
  restoreMatchMedia();
  window.history.replaceState(null, '', INITIAL_HREF);
  document.body.style.overflow = '';
});

type HarnessProps = {
  /** 안쪽 입력이 Escape 를 먼저 소비하는 상황(검색어 지우기 등)을 재현한다. */
  swallowEscape?: boolean;
};

function Harness({ swallowEscape = false }: HarnessProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [monthly, setMonthly] = useState('');

  return (
    <>
      <button type="button" aria-controls="config-drawer" aria-expanded={isOpen} onClick={() => setIsOpen(true)}>
        설정 열기
      </button>
      <SideDrawer
        id="config-drawer"
        isOpen={isOpen}
        title="투자 설정"
        closeLabel="설정 닫기"
        // 인라인 화살표라 렌더마다 identity 가 바뀐다 — 호출부 메모이제이션에 기대지 않는지 함께 본다.
        onClose={() => setIsOpen(false)}
      >
        <label htmlFor="monthly">월 적립</label>
        <input
          id="monthly"
          value={monthly}
          onChange={(event) => setMonthly(event.target.value)}
          onKeyDown={(event) => {
            if (swallowEscape && event.key === 'Escape') event.preventDefault();
          }}
        />
      </SideDrawer>
    </>
  );
}

function openButton() {
  return screen.getByRole('button', { name: '설정 열기' });
}

function closeButton() {
  return screen.getByRole('button', { name: '설정 닫기' });
}

function panel() {
  return screen.getByRole('complementary', { name: '투자 설정' });
}

describe('SideDrawer', () => {
  it('닫혀 있어도 안쪽 입력이 살아 있다 — 다시 열면 값이 그대로다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(openButton());
    await user.type(screen.getByLabelText('월 적립'), '150');
    await user.click(closeButton());

    // 닫힘은 CSS 가 정한다 — 언마운트하면 이 단정이 깨지고 사용자는 입력을 매번 다시 한다.
    expect(screen.getByLabelText('월 적립')).toHaveValue('150');

    await user.click(openButton());
    expect(screen.getByLabelText('월 적립')).toHaveValue('150');
  });

  it('닫혀 있으면 접근성 트리에서도 사라지고, 열면 돌아온다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    /*
     * DOM 에는 남아 있지만(위 테스트) 스크린리더·탭 이동에는 닿지 않아야 한다.
     * `transform` 으로 화면 밖에 밀기만 하면 "안 보이는데 포커스가 들어가는 패널"이 된다 —
     * 닫힘에 `visibility: hidden` 이 함께 붙어야 이 단정이 성립한다.
     */
    expect(screen.queryByRole('complementary', { name: '투자 설정' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '설정 닫기' })).not.toBeInTheDocument();

    await user.click(openButton());

    expect(panel()).toBeVisible();
  });

  it('열리면 닫기 버튼으로 포커스가 가고, 닫히면 열었던 요소로 돌아온다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(openButton());
    expect(closeButton()).toHaveFocus();

    await user.click(closeButton());
    expect(openButton()).toHaveFocus();
  });

  it('안쪽에 타자를 쳐도 포커스를 뺏기지 않는다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(openButton());

    const input = screen.getByLabelText('월 적립');
    await user.click(input);
    await user.type(input, '1500');

    // 포커스 이펙트가 `onClose` 에 매여 있으면 한 글자마다 닫기 버튼으로 끌려가 값이 '1' 에서 멈춘다.
    expect(input).toHaveFocus();
    expect(input).toHaveValue('1500');
  });

  it('Escape 로 닫힌다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(openButton());
    await user.keyboard('{Escape}');

    expect(openButton()).toHaveAttribute('aria-expanded', 'false');
  });

  it('안쪽에서 이미 처리한 Escape 는 가로채지 않는다', async () => {
    const user = userEvent.setup();
    render(<Harness swallowEscape />);

    await user.click(openButton());
    await user.click(screen.getByLabelText('월 적립'));
    await user.keyboard('{Escape}');

    // 안쪽 입력의 "Escape = 값 지우기"가 먼저다 — 지울 게 없을 때만 드로어가 닫힌다.
    expect(openButton()).toHaveAttribute('aria-expanded', 'true');
  });

  it('바깥(스크림) 클릭으로 닫힌다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(openButton());

    // 스크림은 장식(aria-hidden)이라 접근성 트리에 없다 — 패널의 바로 앞 형제라는 자기 구조로 찾는다.
    const scrim = panel().previousElementSibling;
    expect(scrim).not.toBeNull();
    await user.click(scrim as Element);

    expect(openButton()).toHaveAttribute('aria-expanded', 'false');
  });

  it('뒤로가기로 닫히고, 그때 URL 은 바뀌지 않는다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const urlBeforeOpen = window.location.href;
    await user.click(openButton());
    expect(window.location.href).toBe(urlBeforeOpen);

    await goBack();

    await waitFor(() => expect(openButton()).toHaveAttribute('aria-expanded', 'false'));
    expect(window.location.href).toBe(urlBeforeOpen);
  });

  it('좁은 화면에서는 여는 동안 페이지 스크롤을 잠그고, 닫으면 되돌린다', async () => {
    stubViewportWidth(NARROW);
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(openButton());
    expect(document.body.style.overflow).toBe('hidden');

    await user.click(closeButton());
    // 절대값으로 단정한다 — "열기 전 값과 같다"는 앞선 누수가 있을수록 초록이 되는 역-신호다.
    expect(document.body.style.overflow).toBe('');
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('넓은 화면에서는 페이지 스크롤을 잠그지 않는다', async () => {
    stubViewportWidth(WIDE);
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(openButton());

    // 결과를 읽고 스크롤하면서 설정을 만지는 "조정 ↔ 확인" 루프가 이 한 줄에 걸려 있다.
    expect(document.body.style.overflow).toBe('');
  });

  it('대화상자 역할을 선언하지 않는다 — 포커스 트랩이 없기 때문이다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(openButton());

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(panel()).not.toHaveAttribute('aria-modal');
    // 제목이 곧 접근명이다.
    expect(screen.getByRole('heading', { name: '투자 설정' })).toBeInTheDocument();
  });
});
