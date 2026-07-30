import { SideDrawer } from '@/components/common';
import type { HoldingPickerDrawerProps } from './HoldingPickerDrawer.types';

/**
 * 종목 추가 드로어 — 공용 `SideDrawer` 에 **피커 조합**만 얹은 얇은 래퍼다
 * (`pages/Main/components/SettingsDrawer` 와 같은 패턴).
 *
 * 🔴 2026-07-30 통합 전까지 이 파일은 껍데기(오버레이·포커스·스크롤락·Escape)를 통째로 복제하고
 *   있었고, 그 복제본은 `useOverlayEscape` 를 빠뜨려 **중첩 Escape 스택 밖**에 있었다. 이런 결손은
 *   드로어가 단독으로 뜨는 화면에서는 증상이 없어(위층 오버레이가 없으니) 렌더 테스트로 안 잡힌다 —
 *   위에 모달을 하나 올리는 날 "Escape 한 번에 두 겹이 닫힌다"로 터진다. **껍데기를 다시 복제하지 마라.**
 *
 * 조합의 근거:
 * - `side="right"` · `width="min(420px, 92vw)"` — 목록 피커는 오른쪽에서 나오고 설정 드로어(400px)보다 넓다.
 * - `dimBelow="always"` — 이 드로어는 **전 폭에서 모달**이다(딤+스크롤락 항상). 데스크톱에서 딤·락을
 *   끄는 것은 설정 드로어만의 정책이다("조정 ↔ 확인" 루프 보존, 확정 결정 2026-07-28) — 여기서는
 *   고르고 돌아오는 한 갈래 동선이라 배경을 굴릴 이유가 없다.
 * - `bodyLayout="fill"` — 검색행은 제 높이, 결과 목록이 남은 높이를 전부 먹고 그 안에서만 스크롤한다
 *   (`HoldingPicker` 의 `PickerRoot` 가 `flex: 1 1 auto` 를 기대한다).
 */
export default function HoldingPickerDrawer({
  id,
  isOpen,
  title,
  closeLabel,
  onClose,
  children
}: HoldingPickerDrawerProps) {
  return (
    <SideDrawer
      id={id}
      side="right"
      isOpen={isOpen}
      title={title}
      closeLabel={closeLabel}
      onClose={onClose}
      width="min(420px, 92vw)"
      dimBelow="always"
      bodyLayout="fill"
    >
      {children}
    </SideDrawer>
  );
}
