import { memo, useEffect, useRef } from 'react';
import { PrimaryNav, PrimaryNavLinks } from '@/components/PrimaryNav';
import HeaderOverflowMenu from '@/components/HeaderOverflowMenu';
import ColorSchemeToggle from '@/components/ColorSchemeToggle';
import { AuthControl } from '@/components/community/AuthControl';
import { isCommunityEnabled } from '@/shared/lib/supabase';
import { publishHeaderHeight } from './AppHeader.utils';
import { Actions, HeaderInner, HeaderRoot, LeadingSlot, NavSlot, UtilityGroup } from './AppHeader.styled';
import type { AppHeaderProps } from './AppHeader.types';

/** 앱 표준 좌우 여백 — `FeatureLayout`(시뮬레이터 본문)·티커 셸 본문과 같은 값. */
const DEFAULT_CONTENT_GUTTER = 'clamp(12px, 2vw, 20px)';

/**
 * **앱의 유일한 헤더.** 시뮬레이터 · 내 포트폴리오 · 배당 캘린더 · ETF 소개 · 커뮤니티가 전부 이것을 쓴다.
 *
 * 페이지가 다르다고 헤더를 다시 조립하지 않는다 — 그렇게 하던 시절(3벌 복제)에는 화면을 옮길 때마다
 * 로그인 버튼이 있다 없다 하고 여백·높이가 미묘하게 달랐다. 페이지별 차이는 **슬롯 prop 으로만**
 * 들어온다(`AppHeader.types.ts` 참고). 복제 재발은 `test/shared/appHeaderSingleSource.test.ts` 가 막는다.
 *
 * 형태는 폭에 따라 둘뿐이다. **≥1024 는 한 줄**(브랜드 · 메뉴 · 컨트롤이 같은 줄, 높이 64px 대),
 * **≤1023 은 두 줄**(브랜드 줄 + 전폭 가로 스크롤 메뉴 줄). 어느 쪽이든 DOM 은 하나이고
 * 배치만 `headerControlsGrid` 의 grid-area 가 바꾼다 — 모드마다 다른 마크업을 만들지 마라.
 *
 * 항상 그리는 것:
 *   - 워드마크(홈 링크) + 라우트 메뉴 — `PrimaryNav` / `PrimaryNavLinks`
 *   - **화면 밝기 토글(라이트 ↔ 다크)** — 오른쪽 끝 아이콘 버튼. 2026-08-01 이전에는 같은 자리가
 *     색 프리셋 8종 팝오버(`ThemePresetSwitcher`)였는데, 사용자가 화면을 보고 "옵션이 너무 많다,
 *     라이트·다크 둘만" 이라고 결정해 **이 토글 하나로 줄였다**. 프리셋은 지운 게 아니라 화면에서만
 *     감춘 것이고(노출 목록 = `shared/constants/palette` 의 `VISIBLE_PALETTE_PRESET_IDS`),
 *     되살리려면 그 배열과 이 자리의 컴포넌트를 함께 되돌린다.
 *   - 로그인·프로필 — `AuthControl`. **커뮤니티가 꺼진 배포(`isCommunityEnabled=false`)에선 렌더하지 않는다**
 *     (세션·모달 배선이 없으므로). 이 게이트는 시뮬레이터 헤더의 현행 동작을 그대로 승계한 것이다.
 *   - 더보기(⋯) — 앱 설치(+시뮬레이터에선 튜토리얼·PDF).
 *
 * ⚠ 구 슬롯 `center`(커뮤니티 갤러리 검색)·`below`(모바일 검색 펼침 바)는 **삭제됐다** —
 * 2026-07-31 에 검색이 갤러리 본문 툴바로 내려가면서 소비처가 0이 됐고, 남겨 두면 "헤더 한 줄에
 * 폭을 다투는 위젯을 얹는" 같은 실수를 다시 부른다. 페이지 위젯은 그 페이지 본문 첫 줄에 둔다.
 *
 * ⚠ 번들: `AuthControl`·`HeaderOverflowMenu` 는 시뮬레이터(`MainPage`, eager)가 이미 쓰고 있어
 * 엔트리 그래프에 있다. supabase-js SDK 는 `getSupabaseClient()` 의 **동적 import** 뒤에 있으므로
 * 이 헤더를 티커·캘린더 lazy 청크에서 써도 엔트리에 SDK 가 새로 실리지 않는다(빌드 산출물로 검증).
 *
 * ⚠ `AuthControl` 은 `useCommunityAuth()`(Provider 없으면 throw)에 의존한다 — 커뮤니티가 켜진 배포에서
 * 이 헤더를 쓰는 화면은 **`CommunityAuthProvider` 안**에 있어야 한다(MainPage · CommunityLayout ·
 * TickerPageShell 이 각자 소유).
 */
function AppHeaderComponent({
  brandAs = 'span',
  status,
  actions,
  overflowMenu,
  contentGutter = DEFAULT_CONTENT_GUTTER
}: AppHeaderProps) {
  const rootRef = useRef<HTMLElement>(null);

  /* 헤더 높이를 CSS 변수로 발행한다(아래에 붙는 sticky 요소들이 쓴다). 폰트 로드·상태 배지 등장으로
     높이가 바뀌므로 마운트 1회가 아니라 ResizeObserver 로 계속 따라간다. */
  useEffect(() => {
    const element = rootRef.current;
    if (!element) return undefined;
    publishHeaderHeight(element);
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => publishHeaderHeight(element));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <HeaderRoot ref={rootRef}>
      {/* 슬롯 3개를 **DOM 순서대로** 놓는다: 브랜드 → 메뉴 → 컨트롤.
          배치는 `headerControlsGrid` 의 grid-area 가 정한다(모드별 마크업 분기 없음).

          ⚠ 이 순서는 **≥1024(한 줄)에 맞춘 것**이다 — 거기서는 탭 순서가 눈으로 보는 순서와 같다.
          ≤1023 에서는 메뉴가 아랫줄로 내려가므로 탭이 브랜드 → (아랫줄)메뉴 → (윗줄)로그인·더보기로
          한 번 되짚는다. 반대로 놓으면(컨트롤을 메뉴보다 앞에) 좁은 폭이 맞고 넓은 폭이 어긋난다 —
          두 모드를 동시에 만족시키는 DOM 순서는 없고, **주 사용 폭인 데스크톱을 맞췄다.** */}
      <HeaderInner $gutter={contentGutter}>
        <LeadingSlot>
          <PrimaryNav brandAs={brandAs} withLinks={false} />
          {status}
        </LeadingSlot>

        {/* 라우트 메뉴 — 넘치면 자기 안에서 가로 스크롤된다. 라벨은 어떤 폭에서도 유지(사용자 결정). */}
        <NavSlot>
          <PrimaryNavLinks />
        </NavSlot>

        <Actions>
          {actions}
          {isCommunityEnabled ? <AuthControl /> : null}
          {/* 밝기 · 더보기는 둘 다 "환경 설정"이라 오른쪽 끝에 같은 규격(secondary·sm·iconOnly)으로 붙고,
              2026-08-03 부터 한 묶음(UtilityGroup)으로 선 하나 뒤에 선다 — 페이지 액션·계정과 성격이
              다르기 때문이다. 밝기가 먼저인 이유: 자주 쓰는 쪽을 가장자리 밖으로 밀지 않는다.
              ⚠ 묶음은 배치만 바꾼다 — 두 진입점 모두 그대로 있다(AppHeader.test.tsx 가 세고 있다). */}
          <UtilityGroup>
            <ColorSchemeToggle />
            {/* 기본 더보기엔 튜토리얼이 없다 — 코치마크 투어는 시뮬레이터 화면 전용이라
                다른 화면에서는 띄울 대상이 없다. 시뮬레이터는 자기 메뉴를 넘긴다. */}
            {overflowMenu ?? <HeaderOverflowMenu showTutorial={false} />}
          </UtilityGroup>
        </Actions>
      </HeaderInner>
    </HeaderRoot>
  );
}

const AppHeader = memo(AppHeaderComponent);

export default AppHeader;
