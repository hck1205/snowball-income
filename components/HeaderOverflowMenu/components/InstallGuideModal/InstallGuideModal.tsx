import { createPortal } from 'react-dom';
import { Button } from '@/components/common';
import { ModalActions, ModalBackdrop, ModalPanel, ModalTitle } from '@/components/common/Modal';
// 부모 배럴(../../index.ts)을 경유하면 HeaderOverflowMenu ↔ 하위 컴포넌트 순환이 된다 — 상대 경로로 직접 가져온다.
import { GuideList } from '../../HeaderOverflowMenu.styled';
import type { InstallPlatform } from '../../HeaderOverflowMenu.types';
import type { InstallGuideModalProps } from './InstallGuideModal.types';

const GUIDE_TITLE: Record<InstallPlatform, string> = {
  ios: 'iPhone·iPad에 설치하기',
  android: '홈 화면에 앱 추가하기',
  desktop: '데스크톱에 앱 설치하기'
};

/** 플랫폼별 설치 안내 단계. 브라우저가 네이티브 설치 UI를 안 줄 때 손으로 따라 할 순서다. */
function InstallGuideSteps({ platform }: { platform: InstallPlatform }) {
  if (platform === 'ios') {
    return (
      <GuideList>
        <li>
          Safari 하단(또는 상단)의 <strong>공유</strong> 버튼을 누릅니다.
        </li>
        <li>
          목록을 내려 <strong>홈 화면에 추가</strong>를 선택합니다.
        </li>
        <li>
          우측 상단 <strong>추가</strong>를 누르면 앱 아이콘이 홈 화면에 생깁니다.
        </li>
      </GuideList>
    );
  }

  if (platform === 'android') {
    return (
      <GuideList>
        <li>
          브라우저 우측 상단의 <strong>⋮ 메뉴</strong>를 엽니다.
        </li>
        <li>
          <strong>앱 설치</strong> 또는 <strong>홈 화면에 추가</strong>를 선택합니다.
        </li>
        <li>안내에 따라 설치를 마칩니다.</li>
      </GuideList>
    );
  }

  return (
    <GuideList>
      <li>
        주소창 오른쪽 끝의 <strong>설치 아이콘</strong>(모니터·⊕ 모양)을 클릭합니다.
      </li>
      <li>
        팝업에서 <strong>설치</strong>를 누르면 앱 창으로 열립니다.
      </li>
      <li>아이콘이 없다면 브라우저 메뉴에서 '앱 설치'를 찾아보세요.</li>
    </GuideList>
  );
}

/**
 * 수동 설치 가이드 모달 — `beforeinstallprompt`를 못 받는 브라우저(iOS Safari·Firefox·미지원
 * 데스크톱)에서 플랫폼별 설치 순서를 손으로 안내한다. `document.body`에 포털로 렌더한다.
 */
export default function InstallGuideModal({ platform, titleId, closeButtonRef, onClose, modalRoot }: InstallGuideModalProps) {
  return createPortal(
    <ModalBackdrop
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <ModalPanel>
        <ModalTitle id={titleId}>{GUIDE_TITLE[platform]}</ModalTitle>
        <InstallGuideSteps platform={platform} />
        <ModalActions>
          <Button ref={closeButtonRef} variant="secondary" onClick={onClose}>
            닫기
          </Button>
        </ModalActions>
      </ModalPanel>
    </ModalBackdrop>,
    modalRoot
  );
}
