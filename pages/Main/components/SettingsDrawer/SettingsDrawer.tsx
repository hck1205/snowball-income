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
      /*
       * 기본값(400px)보다 넓힌다(2026-08-11 사용자 지시). 이 드로어는 "고르고 닫는 피커"가 아니라
       * **여러 입력을 나란히 놓고 만지는 작업면**이다 — 400px 에서는 숫자 입력이 한 줄에 하나씩
       * 떨어져 세로로 길어졌다. 폼 그리드(`ConfigInputGrid`)가 컨테이너 쿼리로 2열을 쓰는 폭이라
       * 늘린 만큼 그대로 세로 길이가 줄어든다.
       * ⚠ vw 상한을 92 → 96 으로 함께 올린다 — 좁은 화면에서 560px 에 닿지 못하면 고정폭만 커진 셈이다.
       */
      width="min(96vw, 560px)"
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
