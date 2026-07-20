import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HeaderOverflowMenu from '@/components/HeaderOverflowMenu';

/**
 * "PDF 리포트 저장" 메뉴 항목의 **게이트와 상태 표현** 테스트.
 *
 * 생성 파이프라인(jspdf·html2canvas·echarts)은 여기서 돌리지 않는다 — jsdom에는 캔버스가 없다.
 * 메뉴가 지켜야 하는 계약만 사용자 행동으로 검증한다:
 *   커뮤니티 헤더에는 항목이 없다 / 사유가 있으면 비활성 + 사유가 화면에 보인다 /
 *   생성 중에는 메뉴가 닫히지 않는다 / 실패해도 메뉴가 열린 채 재시도가 보인다.
 */

const openMenu = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: '더보기' }));
  return user;
};

const pdfReportProps = (overrides: Partial<Parameters<typeof HeaderOverflowMenu>[0]['pdfReport'] & object> = {}) => ({
  onDownload: vi.fn(async () => true),
  isGenerating: false,
  failure: null,
  blockedReason: null,
  ...overrides
});

describe('더보기 메뉴 — PDF 리포트 항목 게이트', () => {
  it('showPdfReport를 켜지 않으면 항목이 없다 (커뮤니티 헤더 무변경)', async () => {
    render(<HeaderOverflowMenu />);
    await openMenu();

    expect(screen.queryByRole('menuitem', { name: /PDF 리포트 저장/ })).not.toBeInTheDocument();
  });

  it('시뮬레이터에서는 항목이 튜토리얼 아래에 노출된다', async () => {
    render(<HeaderOverflowMenu showPdfReport pdfReport={pdfReportProps()} />);
    await openMenu();

    const items = screen.getAllByRole('menuitem').map((item) => item.textContent ?? '');
    expect(items[0]).toContain('튜토리얼');
    expect(items[1]).toContain('PDF 리포트 저장');
  });
});

describe('더보기 메뉴 — PDF 리포트 상태', () => {
  it('포트폴리오가 비면 비활성 + 사유가 화면에 보인다', async () => {
    render(
      <HeaderOverflowMenu
        showPdfReport
        pdfReport={pdfReportProps({ blockedReason: '포트폴리오를 구성하면 리포트를 만들 수 있어요' })}
      />
    );
    await openMenu();

    const item = screen.getByRole('menuitem', { name: /PDF 리포트 저장/ });
    expect(item).toBeDisabled();
    expect(screen.getByText('포트폴리오를 구성하면 리포트를 만들 수 있어요')).toBeInTheDocument();
  });

  it('입력값 오류 사유는 포트폴리오 비었음과 다른 문구다', async () => {
    render(
      <HeaderOverflowMenu
        showPdfReport
        pdfReport={pdfReportProps({ blockedReason: '입력값 오류를 수정하면 리포트를 만들 수 있어요' })}
      />
    );
    await openMenu();

    expect(screen.getByText('입력값 오류를 수정하면 리포트를 만들 수 있어요')).toBeInTheDocument();
  });

  it('생성 중에는 라벨이 바뀌고 메뉴가 닫히지 않는다', async () => {
    render(<HeaderOverflowMenu showPdfReport pdfReport={pdfReportProps({ isGenerating: true })} />);
    await openMenu();

    const item = screen.getByRole('menuitem', { name: /리포트 만드는 중/ });
    expect(item).toBeDisabled();
    expect(item).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('리포트를 만들고 있습니다.');
  });

  it('재시도 가능한 실패는 메뉴를 유지한 채 알림과 다시 시도를 보여준다', async () => {
    const onDownload = vi.fn(async () => false);
    render(
      <HeaderOverflowMenu
        showPdfReport
        pdfReport={pdfReportProps({
          failure: { message: '리포트를 만들지 못했어요. 잠시 후 다시 시도해 주세요.', canRetry: true },
          onDownload
        })}
      />
    );
    const user = await openMenu();

    expect(screen.getByRole('alert')).toHaveTextContent('리포트를 만들지 못했어요.');
    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(onDownload).toHaveBeenCalled();
    // 실패는 메뉴를 닫지 않는다 — 사용자가 그 자리에서 다시 시도할 수 있어야 한다.
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('재시도해도 소용없는 실패에는 다시 시도 버튼을 만들지 않는다', async () => {
    render(
      <HeaderOverflowMenu
        showPdfReport
        pdfReport={pdfReportProps({
          failure: {
            message: '이 시나리오로는 리포트를 만들 수 없어요. 포트폴리오와 투자 조건을 확인해 주세요.',
            canRetry: false
          }
        })}
      />
    );
    await openMenu();

    expect(screen.getByRole('alert')).toHaveTextContent('이 시나리오로는 리포트를 만들 수 없어요.');
    expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument();
  });

  it('성공하면 메뉴를 닫고 트리거로 포커스를 되돌린다', async () => {
    const onDownload = vi.fn(async () => true);
    render(<HeaderOverflowMenu showPdfReport pdfReport={pdfReportProps({ onDownload })} />);
    const user = await openMenu();

    await user.click(screen.getByRole('menuitem', { name: /PDF 리포트 저장/ }));

    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '더보기' })).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('리포트가 준비됐습니다.');
  });
});
