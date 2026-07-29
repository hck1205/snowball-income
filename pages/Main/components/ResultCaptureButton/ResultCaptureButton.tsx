import { memo } from 'react';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/common';
import type { ResultCaptureButtonProps } from './ResultCaptureButton.types';
import { CaptureFailureDismiss, CaptureFailureNote, CaptureSlot } from './ResultCaptureButton.styled';

/**
 * 아이콘만 남긴 버튼이라 **보이는 글자가 없다** — 이름은 전부 접근명·툴팁이 진다.
 * `TITLE`은 데스크톱 호버 툴팁이고, `ACCESSIBLE_NAME`은 스크린리더가 읽는 이름이다.
 * 진행 중에는 `Button`이 스피너로 바꿔 그리므로 별도 문구가 필요 없다.
 */
const ACCESSIBLE_NAME = '결과를 이미지로 저장';
const TITLE = '이미지 저장';
const DISMISS_LABEL = '저장 실패 안내 닫기';

/**
 * 앱 공용 아이콘은 16px지만 여기는 조금 크다 — 글자를 뺀 뒤 **아이콘이 유일한 어포던스**라
 * 버튼임이 먼저 읽혀야 한다. sm 버튼의 28px 박스 안이라 상하 5px 여백이 남는다.
 *
 * ⚠ 이 값은 `CaptureSlot` 의 CSS 로도 내려간다. 공용 `Button` 이 `svg { width: 1em }` 로
 * 아이콘을 버튼 글자 크기에 고정하기 때문에, **lucide 의 size prop 만으로는 크기가 바뀌지 않는다.**
 */
const ICON_SIZE = 18;

/**
 * 결과 컨트롤 줄의 **이미지 저장** 버튼 — "간략히" 토글 바로 왼쪽에 선다.
 *
 * 지금 보이는 결과 카드들을 한 장의 PNG로 내려받는다(시나리오 탭 바는 캡처 대상 밖이라 자연히 빠진다).
 * 이 부품은 **상태를 갖지 않는다** — 진행/실패는 `useResultCapture` 가 쥐고 props 로 내려온다.
 *
 * 아이콘 전용(`iconOnly`)이다 — 탭 줄은 좁은 폭에서 가장 먼저 눌리는 자리라 글자를 뺐다.
 * 대신 실패는 아래 `CaptureFailureNote` 가 **글자로** 말한다(무음 실패 금지).
 */
function ResultCaptureButtonComponent({
  isCapturing,
  failure,
  onCapture,
  onDismissFailure
}: ResultCaptureButtonProps) {
  return (
    <CaptureSlot>
      <Button
        type="button"
        /* 히어로 액션 줄에서 "투자 설정" 옆에 선다 — ghost 는 배경이 없어 버튼으로 안 읽혔다.
           secondary 는 면과 테두리가 있어 아이콘 하나만으로도 눌리는 것임이 드러난다. */
        variant="secondary"
        /* md = 40×40 정사각형(`iconOnly` 라 폭도 40px). "투자 설정" 버튼이 md 라 높이가 정확히 맞는다. */
        size="md"
        iconOnly
        loading={isCapturing}
        aria-label={ACCESSIBLE_NAME}
        title={TITLE}
        startIcon={<Camera size={ICON_SIZE} strokeWidth={1.8} aria-hidden focusable={false} />}
        onClick={onCapture}
      />
      {/* 무음 실패 금지 — 사유를 그 자리에서 말한다. 읽고 나면 닫을 수 있어야 한다(안 그러면
          다음 시도까지 결과 위에 계속 떠 있다). */}
      {failure ? (
        <CaptureFailureNote role="alert">
          <span>{failure.message}</span>
          <CaptureFailureDismiss type="button" aria-label={DISMISS_LABEL} onClick={onDismissFailure}>
            <X size={14} strokeWidth={1.8} aria-hidden focusable={false} />
          </CaptureFailureDismiss>
        </CaptureFailureNote>
      ) : null}
    </CaptureSlot>
  );
}

const ResultCaptureButton = memo(ResultCaptureButtonComponent);

export default ResultCaptureButton;
