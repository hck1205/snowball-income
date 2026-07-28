import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { activeScenarioIdAtom, scenarioTabsAtom } from '@/jotai';
import { MainResultGrid, ResultCaptureButton, ScenarioTabsRow } from '@/pages/Main/components';
import { CAPTURE_EXCLUDE_ATTRIBUTE, RESULT_CAPTURE_ROOT_ATTRIBUTE, useResultCapture } from '@/pages/Main/hooks';
import SettingsEntryButton from '@/pages/Main/components/SettingsEntryButton';

/**
 * 결과 **이미지 저장**의 계약.
 *
 * jsdom 은 캔버스도 레이아웃도 계산하지 못하므로 "그림이 제대로 나오는가"는 여기서 검증할 수 없다
 * (실브라우저 육안 항목). 여기서 못 박는 것은 **깨지면 기능이 조용히 사라지는 세 가지**다:
 *   ① 버튼이 역할·접근명으로 존재하는가
 *   ② 클릭이 캡처 파이프라인을 활성 시나리오 이름과 함께 부르는가 + 실패를 화면에 말하는가
 *   ③ 캡처 대상(결과 그리드)이 **시나리오 탭 바를 품지 않는가**, 그리고 제외 마커가 실제로 붙는가
 */

const captureResultImage = vi.fn((_input: { scenarioName: string }): Promise<string> => Promise.resolve(''));

// 훅이 `await import('./resultCapturePipeline')` 로 부르는 그 모듈. 목이 없으면 html2canvas 가 돈다.
vi.mock('@/pages/Main/hooks/interaction/resultCapturePipeline', () => ({
  captureResultImage: (input: { scenarioName: string }) => captureResultImage(input)
}));

function CaptureHarness() {
  const { isCapturing, failure, captureResult } = useResultCapture();
  return <ResultCaptureButton isCapturing={isCapturing} failure={failure} onCapture={captureResult} />;
}

const renderHarness = () => {
  const store = createStore();
  store.set(scenarioTabsAtom, [{ id: 'tab-1', name: '내 배당 계획' }] as never);
  store.set(activeScenarioIdAtom, 'tab-1');

  return render(
    <Provider store={store}>
      <CaptureHarness />
    </Provider>
  );
};

const captureButton = () => screen.getByRole('button', { name: '결과를 이미지로 저장' });

beforeEach(() => {
  captureResultImage.mockReset();
  captureResultImage.mockResolvedValue('스노우볼결과_내_배당_계획_20260729.png');
});

describe('결과 이미지 저장 — 버튼', () => {
  it('접근명을 가진 버튼으로 존재한다', () => {
    renderHarness();

    expect(captureButton()).toBeInTheDocument();
  });

  it('클릭하면 활성 시나리오 이름과 함께 캡처를 실행한다', async () => {
    renderHarness();

    await userEvent.click(captureButton());

    await waitFor(() => expect(captureResultImage).toHaveBeenCalledTimes(1));
    expect(captureResultImage).toHaveBeenCalledWith(expect.objectContaining({ scenarioName: '내 배당 계획' }));
  });

  it('실패하면 조용히 끝내지 않고 사유를 알린다', async () => {
    captureResultImage.mockRejectedValue(new Error('boom'));
    renderHarness();

    await userEvent.click(captureButton());

    expect(await screen.findByRole('alert')).toHaveTextContent('이미지를 만들지 못했습니다');
  });
});

describe('결과 이미지 저장 — 캡처 범위', () => {
  /**
   * 사용자 요구는 "탭 영역은 제외하고 결과 박스만"이었다. 지금 구조에서 그것이 성립하는 이유는
   * 탭 바가 캡처 루트의 **형제**이기 때문이다 — 둘 중 하나가 다른 하나 안으로 들어가면 그 순간 깨진다.
   */
  it('캡처 루트는 결과 그리드이고 시나리오 탭 줄을 품지 않는다', () => {
    const { container } = render(
      <>
        <ScenarioTabsRow showCompactToggle isResultCompact={false} onToggleCompact={() => undefined}>
          <div role="tablist" aria-label="시나리오 탭" />
        </ScenarioTabsRow>
        <MainResultGrid summary={<span>요약</span>} />
      </>
    );

    const root = container.querySelector(`[${RESULT_CAPTURE_ROOT_ATTRIBUTE}]`);
    expect(root).not.toBeNull();
    expect(root).toContainElement(screen.getByText('요약'));
    expect(root).not.toContainElement(screen.getByRole('tablist'));
    // "간략히" 토글도 탭 줄에 있으므로 캡처 밖이다.
    expect(root).not.toContainElement(screen.getByRole('checkbox', { name: '결과 간략히 보기' }));
  });

  it('결과 카드 안의 "조건 수정" 버튼에는 캡처 제외 마커가 붙는다', () => {
    render(<SettingsEntryButton variant="inline" drawerId="d1" isOpen={false} onOpen={() => undefined} />);

    const [button] = screen.getAllByRole('button');
    expect(button).toHaveAttribute(CAPTURE_EXCLUDE_ATTRIBUTE);
  });
});
