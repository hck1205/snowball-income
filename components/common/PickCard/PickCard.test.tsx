import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { color } from '@/shared/styles';
import PickCard, { PickCardGrid } from './PickCard';
import { resolveCapPaint, resolveControlKind } from './PickCard.utils';

/**
 * 이 부품의 계약은 **사용자가 겪는 것**으로만 검사한다 — 클래스명·Emotion 내부는 보지 않는다.
 * 색 결정만 순수 함수(`resolveCapPaint`)로 갈라 두었기 때문에 값 검사도 소스가 아니라 반환값으로 한다.
 */
describe('PickCard', () => {
  it('제목과 본문을 그대로 읽힌다', () => {
    render(
      <PickCard title="배당 성장형" subtitle="장기 성장에 무게를 둡니다">
        연 3.2% · 12종목
      </PickCard>
    );

    expect(screen.getByRole('heading', { name: '배당 성장형' })).toBeInTheDocument();
    expect(screen.getByText('장기 성장에 무게를 둡니다')).toBeInTheDocument();
    expect(screen.getByText('연 3.2% · 12종목')).toBeInTheDocument();
  });

  it('아무 동작도 주지 않으면 누를 수 없는 면이다 (정보 카드)', () => {
    render(<PickCard title="고배당 중심" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('onClick 을 주면 카드가 버튼이 되고 제목이 그 이름이 된다', async () => {
    const onClick = vi.fn();
    render(<PickCard title="월배당 조합" onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: '월배당 조합' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('href 를 주면 링크가 된다', () => {
    render(<PickCard title="SCHD 소개" href="https://example.com/schd" />);

    expect(screen.getByRole('link', { name: 'SCHD 소개' })).toHaveAttribute('href', 'https://example.com/schd');
  });

  it('to 를 주면 앱 내부 링크(SPA 전환)가 된다', () => {
    render(
      <MemoryRouter>
        <PickCard title="종목 비교하기" to="/ticker/compare" />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: '종목 비교하기' })).toHaveAttribute('href', '/ticker/compare');
  });

  /**
   * 🔴 이 부품이 존재하는 이유의 절반이다 — 카드 전체를 `button` 으로 만들면 제거 버튼이
   * **버튼 안의 버튼**이 되어 유효하지 않은 HTML 이 된다. 두 컨트롤이 각각 살아 있어야 한다.
   */
  it('카드 전체가 눌리면서도 카드 안 버튼이 따로 눌린다 (버튼 안의 버튼이 아니다)', async () => {
    const onPick = vi.fn();
    const onRemove = vi.fn();
    render(
      <PickCard
        title="내 조합 A"
        onClick={onPick}
        titleRight={
          <button type="button" onClick={onRemove}>
            제거
          </button>
        }
      />
    );

    const remove = screen.getByRole('button', { name: '제거' });
    expect(remove.closest('button')).toBe(remove);

    await userEvent.click(remove);
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onPick).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: '내 조합 A' }));
    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it('actions 슬롯의 버튼도 카드 클릭과 독립적으로 눌린다', async () => {
    const onPick = vi.fn();
    const onCompare = vi.fn();
    render(
      <PickCard
        title="JEPI"
        onClick={onPick}
        actions={
          <button type="button" onClick={onCompare}>
            비교에 담기
          </button>
        }
      />
    );

    await userEvent.click(screen.getByRole('button', { name: '비교에 담기' }));

    expect(onCompare).toHaveBeenCalledTimes(1);
    expect(onPick).not.toHaveBeenCalled();
  });

  /** 선택은 색만으로 말하지 않는다 — 글자가 함께 말해야 회색조에서도 읽힌다. */
  it('선택 상태를 글자로도 알린다', () => {
    render(<PickCard title="배당 성장형" onClick={() => {}} selected />);

    expect(screen.getByRole('button', { name: /배당 성장형/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('선택됨')).toBeInTheDocument();
  });

  it('비활성 카드는 눌리지 않는다', async () => {
    const onClick = vi.fn();
    render(<PickCard title="준비 중" onClick={onClick} disabled />);

    await userEvent.click(screen.getByRole('button', { name: '준비 중' }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('캡 라벨은 장식이 아니라 읽히는 텍스트다', () => {
    render(
      <PickCard title="SCHD" cap={{ kind: 'tint', axis: 'accent', glyph: <svg />, label: '배당성장' }}>
        본문
      </PickCard>
    );

    expect(screen.getByText('배당성장')).toBeInTheDocument();
  });

  it('제목 태그를 문서 개요에 맞게 고를 수 있다', () => {
    render(<PickCard title="가계부 열기" titleAs="h2" />);

    expect(screen.getByRole('heading', { level: 2, name: '가계부 열기' })).toBeInTheDocument();
  });

  it('투어 앵커를 그대로 내보낸다', () => {
    const { container } = render(<PickCard title="프리셋" dataTour="preset-card" />);

    expect(container.querySelector('[data-tour="preset-card"]')).not.toBeNull();
  });
});

describe('PickCardGrid — 틴트 클러스터 옵트인', () => {
  it('cluster 를 켜면 tintscan 이 읽는 표식을 한 값으로 낸다', () => {
    const { container } = render(
      <PickCardGrid cluster>
        <PickCard title="A" />
        <PickCard title="B" />
      </PickCardGrid>
    );

    // 🔴 값은 부품이 고정한다 — 라우트당 한 값만 허용되므로 호출부가 고를 여지를 주지 않는다.
    expect(container.querySelector('[data-tint-cluster]')?.getAttribute('data-tint-cluster')).toBe('pick-grid');
  });

  it('기본값은 표식 없음이다 (레일 캡 격자는 클러스터가 필요 없다)', () => {
    const { container } = render(
      <PickCardGrid>
        <PickCard title="A" />
      </PickCardGrid>
    );

    expect(container.querySelector('[data-tint-cluster]')).toBeNull();
  });

  it('목록 시맨틱으로도 쓸 수 있다', () => {
    render(
      <PickCardGrid as="ul">
        <PickCard as="li" title="A" />
        <PickCard as="li" title="B" />
      </PickCardGrid>
    );

    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(2);
  });
});

describe('resolveCapPaint — 색은 토큰에서만 온다', () => {
  it('축마다 역할 토큰 4종을 고른다', () => {
    const paint = resolveCapPaint({ kind: 'tint', axis: 'accent', glyph: null });

    expect(paint).toEqual({
      rail: color.accent,
      fill: color.accentSubtle,
      ink: color.accentText,
      edge: color.accentBorder
    });
  });

  /** identity 채움 위 텍스트는 다크에서 2.79:1 — `semantic.ts` 가 명시적으로 금지한 조합이다. */
  it('identity 축의 글자색은 채움색이 아니라 identityText 다', () => {
    const paint = resolveCapPaint({ kind: 'rail', axis: 'identity', glyph: null });

    expect(paint.ink).toBe(color.identityText);
    expect(paint.ink).not.toBe(color.identity);
  });

  it('scoped 축은 호출부가 준 변수를 그대로 쓴다', () => {
    const paint = resolveCapPaint({
      kind: 'tint',
      axis: 'scoped',
      scopedVar: '--tk-active-bg',
      scopedInkVar: '--tk-text',
      glyph: null
    });

    expect(paint.fill).toBe('var(--tk-active-bg)');
    expect(paint.ink).toBe('var(--tk-text)');
  });

  /** 모르는 색 위에 색 글자를 얹으면 대비를 보장할 수 없다 → 중립 텍스트로 떨어진다. */
  it('scoped 축에 잉크 변수를 안 주면 중립 텍스트로 떨어진다', () => {
    const paint = resolveCapPaint({ kind: 'tint', axis: 'scoped', scopedVar: '--sb-chart-series-2', glyph: null });

    expect(paint.ink).toBe(color.text);
  });

  it('scoped 인데 변수를 빠뜨리면 무채색이 아니라 브랜드 축으로 떨어진다', () => {
    const paint = resolveCapPaint({ kind: 'rail', axis: 'scoped', glyph: null });

    expect(paint.rail).toBe(color.brand);
  });
});

describe('resolveControlKind', () => {
  it.each([
    [{ to: '/x' }, 'router'],
    [{ href: 'https://x' }, 'anchor'],
    [{ onClick: () => {} }, 'button'],
    [{}, 'none']
  ])('%o → %s', (input, expected) => {
    expect(resolveControlKind(input)).toBe(expected);
  });
});
