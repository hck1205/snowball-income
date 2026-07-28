import { memo } from 'react';
import { SideDrawer } from '@/components/common';
import { SIMULATOR_COPY } from '@/shared/constants';
// 형제 폴더 직접 참조 — 상위 배럴(@/pages/Main/components)은 이 파일 자신도 재수출해 import 순환이 된다.
import MainLeftPanel from '../MainLeftPanel';
import type { SettingsDrawerProps } from './SettingsDrawer.types';

/**
 * 투자 설정 드로어 — 공용 `SideDrawer` 껍데기 + 좌패널(`MainLeftPanel`) 본문.
 *
 * 🔴 **조건부 마운트로 바꾸지 마라**(`{isOpen && <MainLeftPanel/>}`). 좌패널은
 *  ①IndexedDB 하이드레이션 트리거와 ②`onHydratedChange`·`onRegisterRetryCloudSave`·
 *  `onRegisterResumeConflict` 세 배선의 소유자다. 언마운트하면 우패널이 영구 로더로 굳고
 *  드로어를 여닫을 때마다 자동저장 flush 가 IndexedDB 쓰기를 유발한다.
 *  `SideDrawer` 는 패널을 항상 마운트하고 열림만 CSS 로 표현하므로 그대로 두면 된다.
 */
function SettingsDrawerComponent({
  drawerId,
  isOpen,
  onClose,
  onHydratedChange,
  onRegisterRetryCloudSave,
  onRegisterResumeConflict
}: SettingsDrawerProps) {
  return (
    <SideDrawer
      id={drawerId}
      isOpen={isOpen}
      title={SIMULATOR_COPY.settingsTitle}
      closeLabel={SIMULATOR_COPY.settingsClose}
      onClose={onClose}
    >
      <MainLeftPanel
        onHydratedChange={onHydratedChange}
        onRegisterRetryCloudSave={onRegisterRetryCloudSave}
        onRegisterResumeConflict={onRegisterResumeConflict}
      />
    </SideDrawer>
  );
}

const SettingsDrawer = memo(SettingsDrawerComponent);

export default SettingsDrawer;
