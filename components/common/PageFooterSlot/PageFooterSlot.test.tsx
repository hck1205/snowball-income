import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { PageFooterSlotProvider, usePageFooterSlot } from './index';

/**
 * 푸터 착지점의 계약.
 *
 * 이 부품이 지키는 것은 **DOM 상의 위치** 하나다 — 푸터가 `<main>` 밖, 헤더와 같은 층에 서야
 * `contentinfo` 랜드마크가 살고 전폭 띠가 된다(근거 전문은 `PageFooterSlot.tsx` 머리말).
 *
 * ⚠ 여기서 포털의 시각 결과를 검사하지 않는다 — jsdom 은 레이아웃을 계산하지 않는다.
 *   전폭·바닥 고정은 실브라우저 실측의 몫이고(uiprobe), 이 파일은 **배선**만 잠근다.
 */
function Probe() {
  const slot = usePageFooterSlot();
  return <span data-testid="probe">{slot ? 'has-slot' : 'no-slot'}</span>;
}

describe('PageFooterSlot', () => {
  /**
   * 🔴 슬롯은 children **뒤**에 열려야 한다. 앞에 두면 푸터가 본문 위로 올라간다.
   * DOM 순서로 확인한다 — 마지막 자식이 슬롯이다.
   */
  it('착지점을 children 뒤에 연다', () => {
    const { container } = render(
      <PageFooterSlotProvider>
        <p>본문</p>
      </PageFooterSlotProvider>
    );

    const children = [...container.children];
    expect(children).toHaveLength(2);
    expect(children[0]?.tagName).toBe('P');
    expect(children[1]?.tagName).toBe('DIV');
  });

  /**
   * 🔴 착지점은 **레이아웃에 참여하지 않는다**(`display: contents`). 상자를 가지면 푸터가 그
   * 상자의 자식이 되어 헤더와 형제가 아니게 된다 — 사용자 요구는 "header와 같은 level" 이었다.
   */
  it('착지점은 레이아웃 상자를 만들지 않는다', () => {
    const { container } = render(
      <PageFooterSlotProvider>
        <p>본문</p>
      </PageFooterSlotProvider>
    );

    const slot = container.lastElementChild as HTMLElement;
    expect(slot.style.display).toBe('contents');
  });

  /** 마운트 뒤에는 소비자가 착지점을 볼 수 있어야 한다(useLayoutEffect 로 페인트 전에 붙는다). */
  it('마운트 뒤 소비자에게 착지점을 준다', () => {
    const { getByTestId } = render(
      <PageFooterSlotProvider>
        <Probe />
      </PageFooterSlotProvider>
    );

    expect(getByTestId('probe').textContent).toBe('has-slot');
  });

  /**
   * ⚠ Provider 없이 쓰는 화면(시뮬레이터 외 임베드·단위 테스트 수십 개)이 있다.
   * 그때는 `null` 이어야 하고, 소비자(`PageFooter`)는 제자리에 그린다 — 기능이 사라지지 않는다.
   */
  it('Provider 밖에서는 착지점이 없다', () => {
    const { getByTestId } = render(<Probe />);

    expect(getByTestId('probe').textContent).toBe('no-slot');
  });
});
