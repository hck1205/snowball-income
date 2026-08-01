import { memo, useCallback } from 'react';
// per-icon named import(트리셰이킹) — 엔트리에는 Moon/Sun 두 아이콘만 실린다(PrimaryNav와 동일 패턴).
import { Moon, Sun } from 'lucide-react';
import { useEffectiveColorScheme, useSetColorSchemeWrite } from '@/jotai';
import { ANALYTICS_EVENT, setUserProperties, trackEvent } from '@/shared/lib/analytics';
import { Button } from '@/components/common';
import { ToggleRoot } from './ColorSchemeToggle.styled';

/**
 * **화면 밝기 토글(라이트 ↔ 다크).** 헤더 오른쪽 끝, `⋯` 더보기 왼쪽에 상시 노출한다.
 *
 * 왜 이것만 남았나 (2026-08-01, 사용자가 화면을 보고 내린 결정):
 *   "설정을 고를 수 있는 옵션이 너무 많다. 그냥 라이트·다크 두 개만 있으면 좋겠다."
 * 그전에는 같은 자리에 색 프리셋 8종 팝오버(`ThemePresetSwitcher`)가 있었다. 프리셋은
 * **삭제된 게 아니라 화면에서만 감춰졌다** — 노출 목록은 `shared/constants/palette` 의
 * `VISIBLE_PALETTE_PRESET_IDS` 한 곳이고, 되살리는 법도 거기 적혀 있다.
 *
 * - 상태는 세 값(`system`/`light`/`dark`)이지만 **버튼은 둘만 오간다.** 첫 방문은 `system`
 *   (OS 설정을 따름)이고, 한 번 누르는 순간 사용자가 명시적으로 고른 값으로 굳는다.
 *   "OS 따름"으로 되돌리는 세 번째 상태를 UI에 두지 않는 이유는 이 미션의 전제 그대로다 —
 *   고를 것을 늘리지 않는다(값 자체는 남아 있어 언제든 되살릴 수 있다).
 * - 실제 반영(`html[data-theme]`·localStorage)은 atom 계층이 한다. 이 컴포넌트는 DOM을 만지지 않는다.
 * - 상태는 **색이 아니라 글리프(해/달)와 `aria-pressed`** 로 전달한다.
 */
function ColorSchemeToggleComponent() {
  const scheme = useEffectiveColorScheme();
  const setColorScheme = useSetColorSchemeWrite();
  const isDark = scheme === 'dark';

  const toggle = useCallback(() => {
    const next = isDark ? 'light' : 'dark';
    setColorScheme(next);
    /*
     * 계측 이벤트·파라미터는 프리셋 스위처 시절 그대로 쓴다(택소노미 단절 방지) —
     * 이제 `preset_id` 로 들어오는 값이 'light'/'dark' 라는 점만 달라진다.
     * 자세한 배경은 shared/lib/analytics.ts 의 THEME_PRESET_CHANGED 주석 참고.
     */
    trackEvent(ANALYTICS_EVENT.THEME_PRESET_CHANGED, { preset_id: next });
    setUserProperties({ preferred_theme: next });
  }, [isDark, setColorScheme]);

  return (
    <ToggleRoot>
      <Button
        // 헤더 형제(더보기·로그인)와 같은 secondary 아이콘 버튼. 라벨이 없으므로 aria-label 필수.
        variant="secondary"
        size="sm"
        iconOnly
        aria-label="다크 모드"
        aria-pressed={isDark}
        // 접근명은 "무엇을 켜고 끄는가"(다크 모드), 툴팁은 "누르면 무엇이 되는가"를 말한다.
        title={isDark ? '라이트 모드로 바꿉니다' : '다크 모드로 바꿉니다'}
        onClick={toggle}
      >
        {isDark ? (
          <Moon size={16} strokeWidth={1.8} aria-hidden focusable={false} />
        ) : (
          <Sun size={16} strokeWidth={1.8} aria-hidden focusable={false} />
        )}
      </Button>
    </ToggleRoot>
  );
}

const ColorSchemeToggle = memo(ColorSchemeToggleComponent);

export default ColorSchemeToggle;
