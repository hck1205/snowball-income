import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Download, GraduationCap, MoreHorizontal, Palette } from 'lucide-react';
import { Button } from '@/components/common';
import { ModalActions, ModalBackdrop, ModalPanel, ModalTitle } from '@/components/common/Modal';
import { isTourSeen } from '@/components/TourGuide';
import ThemePresetSwitcher from '@/components/ThemePresetSwitcher';
import { TOUR_STORAGE_KEY } from '@/shared/constants';
import { useSetTourLaunchRequestWrite } from '@/jotai';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import {
  GuideList,
  Menu,
  MenuItem,
  MenuRoot,
  NewDot,
  ThemeCaret,
  ThemeMenuLabel,
  ThemePanel
} from './HeaderOverflowMenu.styled';

/**
 * Chrome/Edge가 "설치 가능" 시점에 던지는 `beforeinstallprompt` 이벤트.
 * 표준 lib.dom 에 없어 여기서 형태만 선언한다(우리가 쓰는 필드만).
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

/** 이미 홈화면/앱(standalone)으로 실행 중인가. */
const isRunningStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  const displayModeStandalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return displayModeStandalone || iosStandalone;
};

type InstallPlatform = 'ios' | 'android' | 'desktop';

/** 수동 설치 가이드용 플랫폼 판정 — 네이티브 프롬프트가 없을 때만 쓰인다. */
const detectInstallPlatform = (): InstallPlatform => {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  // iPadOS 13+ 는 데스크톱 Mac UA로 위장한다 — 터치 포인트로 구분한다.
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
};

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

export type HeaderOverflowMenuProps = {
  /**
   * 튜토리얼(코치마크 투어) 항목을 메뉴에 넣을지. 기본 true.
   * false면 튜토리얼 메뉴 항목·첫 방문 유도 점·투어 트리거를 전부 스킵한다 — 코치마크 투어가 없는
   * 표면(커뮤니티 헤더 등)에서 "앱 설치 + 테마"만 담기 위함. 시뮬레이터 헤더는 기본(true)이라 불변.
   */
  showTutorial?: boolean;
};

/**
 * 헤더 "더보기(⋯)" 메뉴 — 아이콘 전용 트리거로 헤더 공간을 아끼고, 부가 액션을 드롭다운에 모은다.
 *
 * 담는 항목:
 *   - **튜토리얼 보기**(showTutorial일 때만): `tourLaunchRequestAtom`을 bump → `TourGuide`가 감지해 코치마크 투어를 연다.
 *   - **앱 설치**: 브라우저 지원에 따라 분기한다.
 *       · `beforeinstallprompt`가 잡혀 있으면(Chrome/Edge) 네이티브 설치 프롬프트를 띄운다.
 *       · 아니면(iOS Safari·Firefox·미지원 데스크톱) 플랫폼별 **수동 설치 가이드 모달**을 연다.
 *       · 이미 설치(standalone)면 "설치됨"으로 비활성 표시한다.
 *   - **테마**: 디스클로저(aria-expanded/controls)를 누르면 `ThemePresetSwitcher variant="menu"`의
 *       radiogroup을 메뉴 안에서 인라인으로 편다. 선택해도 메뉴가 닫히지 않아 프리셋을 비교/전환할 수 있다.
 *       (테마 접근점은 로그인·커뮤니티 여부와 무관하게 항상 노출되는 이 메뉴에만 둔다.)
 *
 * 첫 방문 유도 점은 `showTutorial && !hasSeenTour`일 때 트리거 모서리에 걸어, 신규 사용자가 튜토리얼을 발견하게 한다.
 * 드롭다운 개폐/포커스 관리는 AuthControl 드롭다운과 같은 메커니즘(바깥 pointerdown·Esc, role=menu)을 따른다.
 */
export default function HeaderOverflowMenu({ showTutorial = true }: HeaderOverflowMenuProps) {
  const bumpTourLaunch = useSetTourLaunchRequestWrite();

  const [open, setOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useState(true);
  const [guidePlatform, setGuidePlatform] = useState<InstallPlatform | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const guideCloseRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const themePanelId = useId();
  const guideTitleId = useId();

  // 메뉴가 닫히면 테마 펼침도 접는다 — 다시 열 때 항상 접힌 상태로 시작한다.
  useEffect(() => {
    if (!open) setThemeOpen(false);
  }, [open]);

  // 첫 페인트 이후에 읽는다 — 초기 state로 localStorage/matchMedia를 읽으면 하이드레이션 불일치 위험이 있다.
  // 튜토리얼을 숨긴 표면(showTutorial=false)에선 유도 점 자체가 없으므로 seen 여부를 읽지 않는다.
  useEffect(() => {
    if (!showTutorial) return;
    setHasSeenTour(isTourSeen(TOUR_STORAGE_KEY));
  }, [showTutorial]);

  useEffect(() => {
    if (isRunningStandalone()) {
      setIsStandalone(true);
      return undefined;
    }

    const onBeforeInstallPrompt = (event: Event) => {
      // 기본 미니 인포바를 막고, "앱 설치"를 누르는 시점에 띄우기 위해 이벤트를 보관한다.
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  // 드롭다운: 바깥 클릭·Esc로 닫는다(열렸을 때만 리스너를 단다).
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const closeGuide = useCallback(() => {
    setGuidePlatform(null);
    triggerRef.current?.focus();
  }, []);

  // 가이드 모달: Esc로 닫고 트리거로 포커스 복귀. 열릴 때 닫기 버튼으로 초기 포커스를 옮긴다.
  useEffect(() => {
    if (!guidePlatform) return undefined;
    guideCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeGuide();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [guidePlatform, closeGuide]);

  const handleTutorial = useCallback(() => {
    // 사용자가 튜토리얼을 발견했으니 유도 점을 이 세션에서 감춘다(영속 seen 마킹은 TourGuide가 담당).
    setHasSeenTour(true);
    setOpen(false);
    // 트리거로 포커스를 되돌려 두면, 투어가 종료될 때도 여기로 포커스가 돌아온다(TourGuide가 직전 포커스를 복원).
    triggerRef.current?.focus();
    bumpTourLaunch((count) => count + 1);
  }, [bumpTourLaunch]);

  const handleInstall = useCallback(async () => {
    setOpen(false);
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'install_app', outcome });
      // 프롬프트는 1회용이라(수락·거절 무관) 소모되면 버린다. 필요 시 브라우저가 나중에 다시 발화한다.
      setDeferredPrompt(null);
      return;
    }
    // 네이티브 프롬프트 불가 → 플랫폼별 수동 가이드로 안내한다(무음 실패 금지).
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'install_app', outcome: 'guide' });
    setGuidePlatform(detectInstallPlatform());
  }, [deferredPrompt]);

  const modalRoot = typeof document === 'undefined' ? null : document.body;

  return (
    <MenuRoot ref={rootRef}>
      <Button
        ref={triggerRef}
        variant="secondary"
        size="sm"
        iconOnly
        aria-label="더보기"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((prev) => !prev)}
      >
        <MoreHorizontal size={18} strokeWidth={1.8} aria-hidden focusable={false} />
      </Button>
      {showTutorial && !hasSeenTour ? <NewDot data-first-visit="true" aria-hidden="true" /> : null}

      {open ? (
        <Menu id={menuId} role="menu">
          {showTutorial ? (
            <MenuItem type="button" role="menuitem" onClick={handleTutorial}>
              <GraduationCap size={16} strokeWidth={1.8} aria-hidden focusable={false} />
              튜토리얼 보기
            </MenuItem>
          ) : null}
          {isStandalone ? (
            <MenuItem type="button" role="menuitem" disabled aria-disabled="true">
              <Check size={16} strokeWidth={1.8} aria-hidden focusable={false} />
              설치됨
            </MenuItem>
          ) : (
            <MenuItem type="button" role="menuitem" onClick={handleInstall}>
              <Download size={16} strokeWidth={1.8} aria-hidden focusable={false} />
              앱 설치
            </MenuItem>
          )}
          <MenuItem
            type="button"
            role="menuitem"
            aria-haspopup="true"
            aria-expanded={themeOpen}
            aria-controls={themeOpen ? themePanelId : undefined}
            onClick={() => setThemeOpen((prev) => !prev)}
          >
            <Palette size={16} strokeWidth={1.8} aria-hidden focusable={false} />
            <ThemeMenuLabel>테마</ThemeMenuLabel>
            <ThemeCaret open={themeOpen} aria-hidden="true">
              <ChevronDown size={16} strokeWidth={1.8} focusable={false} />
            </ThemeCaret>
          </MenuItem>
          {themeOpen ? (
            <ThemePanel id={themePanelId}>
              {/* 컴포넌트 자체 로직 재사용 — 메뉴 임베드 전용 변형(팝오버/드로어 래퍼·미디어 숨김 없음). */}
              <ThemePresetSwitcher variant="menu" />
            </ThemePanel>
          ) : null}
        </Menu>
      ) : null}

      {guidePlatform && modalRoot
        ? createPortal(
            <ModalBackdrop
              role="dialog"
              aria-modal="true"
              aria-labelledby={guideTitleId}
              onClick={(event) => {
                if (event.target === event.currentTarget) closeGuide();
              }}
            >
              <ModalPanel>
                <ModalTitle id={guideTitleId}>{GUIDE_TITLE[guidePlatform]}</ModalTitle>
                <InstallGuideSteps platform={guidePlatform} />
                <ModalActions>
                  <Button ref={guideCloseRef} variant="secondary" onClick={closeGuide}>
                    닫기
                  </Button>
                </ModalActions>
              </ModalPanel>
            </ModalBackdrop>,
            modalRoot
          )
        : null}
    </MenuRoot>
  );
}
