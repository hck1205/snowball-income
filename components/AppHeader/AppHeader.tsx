import { memo, useEffect, useRef } from 'react';
import { PrimaryNav, PrimaryNavLinks } from '@/components/PrimaryNav';
import HeaderOverflowMenu from '@/components/HeaderOverflowMenu';
import { AuthControl } from '@/components/community/AuthControl';
import { isCommunityEnabled } from '@/shared/lib/supabase';
import { publishHeaderHeight } from './AppHeader.utils';
import { Actions, CenterSlot, ControlsRow, HeaderInner, HeaderRoot, LeadingSlot } from './AppHeader.styled';
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
 * 항상 그리는 것:
 *   - 워드마크(홈 링크) + 아랫줄 라우트 메뉴 — `PrimaryNav` / `PrimaryNavLinks`
 *   - 로그인·프로필 — `AuthControl`. **커뮤니티가 꺼진 배포(`isCommunityEnabled=false`)에선 렌더하지 않는다**
 *     (세션·모달 배선이 없으므로). 이 게이트는 시뮬레이터 헤더의 현행 동작을 그대로 승계한 것이다.
 *   - 더보기(⋯) — 앱 설치 · 테마. 테마 접근점이라 로그인 여부와 무관하게 **항상** 있어야 한다.
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
  center,
  actions,
  overflowMenu,
  below,
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
      <HeaderInner $gutter={contentGutter}>
        {/* 1줄 — 좌: 브랜드(+상태) / 가운데: 페이지 확장 / 우: 액션 + 공용 컨트롤.
            액션이 윗줄에 있는 건 사용자 결정이다(메뉴보다 먼저 닿아야 하는 컨트롤). */}
        <ControlsRow>
          <LeadingSlot>
            <PrimaryNav brandAs={brandAs} withLinks={false} />
            {status}
          </LeadingSlot>

          {center ? <CenterSlot>{center}</CenterSlot> : null}

          <Actions>
            {actions}
            {isCommunityEnabled ? <AuthControl /> : null}
            {/* 기본 더보기엔 튜토리얼이 없다 — 코치마크 투어는 시뮬레이터 화면 전용이라
                다른 화면에서는 띄울 대상이 없다. 시뮬레이터는 자기 메뉴를 넘긴다. */}
            {overflowMenu ?? <HeaderOverflowMenu showTutorial={false} />}
          </Actions>
        </ControlsRow>

        {/* 2줄 — 라우트 메뉴. 가운데 정렬 + 넘치면 가로 스크롤, 라벨은 어떤 폭에서도 유지. */}
        <PrimaryNavLinks />
      </HeaderInner>

      {below}
    </HeaderRoot>
  );
}

const AppHeader = memo(AppHeaderComponent);

export default AppHeader;
