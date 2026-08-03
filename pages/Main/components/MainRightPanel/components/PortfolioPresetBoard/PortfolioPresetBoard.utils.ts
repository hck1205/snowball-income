import type { PickCardCap } from '@/components/common';
import type { PresetTone } from './PortfolioPresetBoard.styled';

/**
 * 묶음 톤 → **레일 캡의 색 축**.
 *
 * 🔴 시뮬레이터는 **레일 캡만** 쓴다(kind: 'rail', 6px). 틴트 캡(48~88px)은 tintscan 이 면으로
 * 세는데 이 라우트의 면 예산은 히어로와 활성 시나리오 탭이 이미 쓰고 있다. 6px 은 스캐너의 높이
 * 하한(8px)에 못 미쳐 세어지지 않는다 — 즉 **여기서는 색을 예산 없이 쓸 수 있다.**
 *
 * neutral(특화 묶음)만 scoped 인 이유: PickCapAxis 에는 중립 축이 없다. 없는 축을 억지로 accent 로
 * 접으면 "특화"가 "균형"과 같은 색이 되어 **색이 거짓말을 한다.** 대신 호출부가 중립 변수를 직접
 * 준다(글자색까지 함께 줘야 캡 글리프가 중립 텍스트로 떨어지지 않는다).
 *
 * ⚠ 값은 CSS 변수 **이름**이다(shared/styles/semantic.ts 의 borderStrong·textSecondary).
 *   color.* 를 넘기면 var(var(--…)) 가 되어 조용히 색이 사라진다.
 *
 * ⚠ 랜딩(PresetBrowser.utils.ts)에 같은 표가 있다. **합치지 않았다** — 두 화면의 묶음 톤 타입이
 *   서로 다른 폴더에서 파생되고, 한쪽이 축을 바꿔야 할 때 다른 쪽까지 끌려가는 결합이 이 표의
 *   크기(4줄)보다 비싸다.
 */
export const PRESET_CAP_AXIS = {
  identity: { axis: 'identity' },
  accent: { axis: 'accent' },
  accentAlt: { axis: 'accentAlt' },
  neutral: { axis: 'scoped', scopedVar: '--sb-border-strong', scopedInkVar: '--sb-text-secondary' }
} as const satisfies Record<PresetTone, Pick<PickCardCap, 'axis' | 'scopedVar' | 'scopedInkVar'>>;
