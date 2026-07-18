import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MainPage } from '@/pages';
import MainContentLoader from '@/pages/Main/components/MainContentLoader';

/**
 * 하이드레이션 홀딩(깜빡임 제거) 계약.
 *
 * 실제 IndexedDB 읽기 지연은 test 모드에서 즉시 하이드레이션으로 단락되므로(usePortfolioPersistence),
 * "로딩 중" 화면을 통합 렌더로 관측하긴 어렵다. 그래서 두 갈래로 계약을 고정한다.
 *  1) 홀딩 로더 자체의 접근성(aria-busy status) — 사용자/보조기기가 "불러오는 중"을 인지한다.
 *  2) 하이드레이션이 끝나면 좌·우 패널이 모두 렌더되어 홀딩이 풀린다(영구 홀딩/데드락이 아님).
 */
describe('하이드레이션 홀딩 로더', () => {
  it('불러오는 동안 aria-busy 상태를 노출한다', () => {
    render(<MainContentLoader label="결과를 불러오는 중…" />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent('결과를 불러오는 중…');
  });

  it('라벨을 안 주면 기본 문구로 폴백한다', () => {
    render(<MainContentLoader />);

    expect(screen.getByRole('status')).toHaveTextContent('불러오는 중…');
  });

  it('하이드레이션이 끝나면 좌·우 패널이 모두 렌더되고 홀딩 로더는 사라진다', () => {
    render(
      <Provider store={createStore()}>
        <MainPage />
      </Provider>
    );

    // 좌패널(입력) 진입점
    expect(screen.getByRole('button', { name: '티커 생성 열기' })).toBeInTheDocument();
    // 우패널(결과) — 빈 상태 프리셋 카드 헤더
    expect(screen.getByRole('heading', { name: '추천 포트폴리오로 시작해보세요' })).toBeInTheDocument();

    // 홀딩 문구는 더 이상 화면에 없다(좌·우 게이트가 모두 열렸다).
    expect(screen.queryByText('설정을 불러오는 중…')).not.toBeInTheDocument();
    expect(screen.queryByText('결과를 불러오는 중…')).not.toBeInTheDocument();
  });
});
