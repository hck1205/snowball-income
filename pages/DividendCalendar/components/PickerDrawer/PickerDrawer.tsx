import { SideDrawer } from '@/components/common';
import type { PickerDrawerProps } from './PickerDrawer.types';

/**
 * 종목 선택 드로어 — 공용 `SideDrawer` 에 **피커 조합**만 얹은 얇은 래퍼다
 * (`pages/Main/components/SettingsDrawer` 와 같은 패턴).
 *
 * 🔴 2026-07-30 통합 전까지 이 파일과 포트폴리오의 `HoldingPickerDrawer` 는 껍데기를 각자 복제하고
 *   있었고(원본-복제 관계였다), 둘 다 `useOverlayEscape` 를 빠뜨려 **중첩 Escape 스택 밖**에 있었다.
 *   각자 잘 동작하는 결손이라 렌더 테스트로 안 잡힌다 — 이 화면에 위층 오버레이를 올리는 날
 *   "Escape 한 번에 두 겹이 닫힌다"로 나타난다. **껍데기를 다시 복제하지 마라.**
 *
 * 조합의 근거:
 * - `side="right"` · `width="min(420px, 92vw)"` — 목록 피커는 오른쪽에서 나오고 설정 드로어(400px)보다 넓다.
 * - `dimBelow="always"` — 폭과 무관하게 오버레이(딤+스크롤락 항상)다. 데스크톱에서 딤·락을 끄는 것은
 *   설정 드로어만의 정책이다(확정 결정 2026-07-28) — 여기는 고르고 돌아오는 한 갈래 동선이다.
 * - `bodyLayout="fill"` — 검색·칩은 제 높이만 쓰고 **결과 목록이 남은 높이를 전부** 채운다
 *   (`TickerPicker` 의 `PickerRoot` 가 `flex: 1 1 auto`). 짧은 max-height + 안쪽 스크롤이면 드로어
 *   아래가 텅 빈다.
 */
export default function PickerDrawer({ id, isOpen, title, closeLabel, onClose, children }: PickerDrawerProps) {
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
