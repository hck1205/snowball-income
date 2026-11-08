import { memo, useCallback } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/common';
import ShareFlowLayer from '@/pages/Main/components/ShareFlowLayer';
import { useShareFlow, useShareLinkCreator } from '@/pages/Main/hooks';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { ShareFailureNote, ShareSlot } from './ResultShareButton.styled';
import type { ResultShareButtonProps } from './ResultShareButton.types';

const LABEL = '결과 공유';
const ICON_SIZE = 18;

/**
 * 시뮬레이터 상단의 **"결과 공유"** 버튼(2026-11-09).
 *
 * ## 왜
 * 공유 기능은 있었지만 설정 드로어 맨 아래 "도구" 카드 안이라, 결과를 본 사람이 공유하려면 드로어를 열어야
 * 했다(GA: 외부 링크 유입 3%). 결과 바로 위 — "이미지 저장" 옆 — 에 같은 기능을 하나 더 둔다.
 * 공유 한 번이 곧 외부 링크 하나라 검색 신뢰(외부 링크 0) 문제와도 맞물린다.
 *
 * ## 같은 흐름, 같은 링크
 * 링크 생성은 `useShareLinkCreator`(저장 훅과 같은 함수), 흐름은 `useShareFlow`, 떠 있는 부분은
 * `ShareFlowLayer` — 드로어의 공유 버튼과 **한 줄도 다르지 않다.** 다른 것은 CTA 계측의 자리(placement)뿐이다.
 * ⚠ 저장 훅(`usePortfolioPersistence`)을 여기서 부르지 않는다 — 부르면 하이드레이션·자동 저장 효과가 두 번 돈다.
 */
function ResultShareButtonComponent({ className }: ResultShareButtonProps) {
  const createShareLink = useShareLinkCreator();
  const flow = useShareFlow(createShareLink);
  const { share } = flow;

  const handleClick = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'result_share', placement: 'simulator_hero' });
    void share();
  }, [share]);

  return (
    <ShareSlot className={className}>
      <Button
        type="button"
        /* 캡처 버튼과 같은 secondary·md(높이 40) — 한 줄에 나란히 선다. 라벨을 붙여 아이콘만인 캡처보다 먼저 읽힌다. */
        variant="secondary"
        size="md"
        loading={flow.isSharing}
        startIcon={<Share2 size={ICON_SIZE} strokeWidth={1.8} aria-hidden focusable={false} />}
        onClick={handleClick}
      >
        {LABEL}
      </Button>
      {flow.failureMessage ? <ShareFailureNote role="alert">{flow.failureMessage}</ShareFailureNote> : null}
      <ShareFlowLayer flow={flow} />
    </ShareSlot>
  );
}

const ResultShareButton = memo(ResultShareButtonComponent);

export default ResultShareButton;
