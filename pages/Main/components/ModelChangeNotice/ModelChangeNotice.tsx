import { memo, useCallback, useState } from 'react';
import { Banner } from '@/components';
import type { ModelChangeNoticeProps } from './ModelChangeNotice.types';
import { MODEL_CHANGE_NOTICE_STORAGE_KEY, isNoticeDismissed, markNoticeDismissed } from './ModelChangeNotice.utils';
import { NoticeFootnote } from './ModelChangeNotice.styled';

/**
 * 정합 모델 전환(`priceGrowth === dividendGrowth`) 안내 배너.
 *
 * 저장된 시나리오·공유 링크의 결과 숫자가 바뀌기 때문에, 안내 없이 배포하면 사용자는 앱이 고장난 것으로
 * 받아들인다. 한 번 닫으면 다시 뜨지 않는다(`localStorage`, 버전 키).
 *
 * 배너 껍데기는 `Banner` 프리미티브가 소유한다 — 톤/닫기/대비가 앱 전체와 일관되게 유지된다.
 */
function ModelChangeNoticeComponent({ storageKey = MODEL_CHANGE_NOTICE_STORAGE_KEY }: ModelChangeNoticeProps) {
  const [isVisible, setIsVisible] = useState(() => !isNoticeDismissed(storageKey));

  const dismiss = useCallback(() => {
    markNoticeDismissed(storageKey);
    setIsVisible(false);
  }, [storageKey]);

  if (!isVisible) return null;

  return (
    <Banner
      tone="info"
      role="status"
      aria-label="계산 방식 업데이트 공지"
      title="계산 방식이 업데이트되었습니다"
      dismissAriaLabel="공지 닫기"
      onDismiss={dismiss}
    >
      <p>
        배당과 주가가 <strong>함께 성장</strong>하도록 계산 방식을 바꿨습니다. 이제 총수익률 가정(배당률 + 성장률)이
        시뮬레이션 결과와 일치합니다.
      </p>
      <p>
        그래서 <strong>이전에 저장한 시나리오와 공유 링크의 결과 숫자가 달라질 수 있습니다.</strong> 특히 QYLD 같은
        배당률이 높은 커버드콜 ETF는 크게 줄어듭니다. 이전 수치는 배당이 주가와 무관하게 성장하는 오류 때문에 과대
        추정된 값이었습니다.
      </p>
      <NoticeFootnote>
        이 앱은 입력한 가정을 그대로 계산해 보여주는 시뮬레이터입니다. 투자 자문이 아니며, 참고용으로만 사용해 주세요.
      </NoticeFootnote>
    </Banner>
  );
}

const ModelChangeNotice = memo(ModelChangeNoticeComponent);

export default ModelChangeNotice;
