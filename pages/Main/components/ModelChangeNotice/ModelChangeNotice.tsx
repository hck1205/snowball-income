import { memo, useCallback, useId, useState } from 'react';
import { Banner } from '@/components';
import type { ModelChangeNoticeProps } from './ModelChangeNotice.types';
import { MODEL_CHANGE_NOTICE_STORAGE_KEY, isNoticeDismissed, markNoticeDismissed } from './ModelChangeNotice.utils';
import { NoticeChevron, NoticeDetail, NoticeFootnote, NoticeToggle } from './ModelChangeNotice.styled';

/**
 * 정합 모델 전환(`priceGrowth === dividendGrowth`) 안내 배너.
 *
 * 저장된 시나리오·공유 링크의 결과 숫자가 바뀌기 때문에, 안내 없이 배포하면 사용자는 앱이 고장난 것으로
 * 받아들인다. 한 번 닫으면 다시 뜨지 않는다(`localStorage`, 버전 키).
 *
 * 기본은 **제목 한 줄만** 보이고, 제목을 클릭하면 상세 설명이 펼쳐진다(디스클로저).
 * 배너 껍데기는 `Banner` 프리미티브가 소유한다 — 톤/닫기/대비가 앱 전체와 일관되게 유지된다.
 */
function ModelChangeNoticeComponent({ storageKey = MODEL_CHANGE_NOTICE_STORAGE_KEY }: ModelChangeNoticeProps) {
  const [isVisible, setIsVisible] = useState(() => !isNoticeDismissed(storageKey));
  const [isExpanded, setIsExpanded] = useState(false);
  const detailId = useId();

  const dismiss = useCallback(() => {
    markNoticeDismissed(storageKey);
    setIsVisible(false);
  }, [storageKey]);

  const toggle = useCallback(() => setIsExpanded((prev) => !prev), []);

  if (!isVisible) return null;

  return (
    <Banner
      tone="info"
      role="status"
      aria-label="계산 방식 업데이트 공지"
      dismissAriaLabel="공지 닫기"
      onDismiss={dismiss}
      align={isExpanded ? 'start' : 'center'}
    >
      <NoticeToggle type="button" onClick={toggle} aria-expanded={isExpanded} aria-controls={detailId}>
        <NoticeChevron aria-hidden="true" data-expanded={isExpanded}>
          <svg viewBox="0 0 24 24">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </NoticeChevron>
        계산 방식이 업데이트되었습니다
      </NoticeToggle>
      {isExpanded ? (
        <NoticeDetail id={detailId}>
          <p>
            배당과 주가가 <strong>함께 자라도록</strong> 계산 방식을 바로잡았습니다. 이제 입력하신 총수익률(배당률 +
            배당성장률)이 결과에 그대로 반영됩니다.
          </p>
          <p>
            그래서 <strong>예전에 저장한 시나리오나 공유 링크의 숫자가 달라질 수 있습니다.</strong> 이전 값은 배당이
            주가와 따로 성장하던 오류로 실제보다 부풀려져 있었고, QYLD 같은 고배당 커버드콜 ETF에서 특히 차이가 큽니다.
          </p>
          <NoticeFootnote>
            이 앱은 입력한 가정을 그대로 계산해 보여주는 시뮬레이터입니다. 투자 자문이 아니니 참고용으로만 사용해 주세요.
          </NoticeFootnote>
        </NoticeDetail>
      ) : null}
    </Banner>
  );
}

const ModelChangeNotice = memo(ModelChangeNoticeComponent);

export default ModelChangeNotice;
