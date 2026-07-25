import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Download, FileText, GraduationCap, Loader2, MoreHorizontal, Palette } from 'lucide-react';
import { Button } from '@/components/common';
import { isTourSeen } from '@/components/TourGuide';
import ThemePresetSwitcher from '@/components/ThemePresetSwitcher';
import { TOUR_STORAGE_KEY } from '@/shared/constants';
import { useSetTourLaunchRequestWrite } from '@/jotai';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { InstallGuideModal } from './components';
import {
  Menu,
  MenuAlert,
  MenuCaption,
  MenuItem,
  MenuItemLabel,
  MenuLiveStatus,
  MenuRoot,
  MenuSpinner,
  NewDot,
  ThemeCaret,
  ThemeMenuLabel,
  ThemePanel
} from './HeaderOverflowMenu.styled';
import { detectInstallPlatform, isRunningStandalone } from './HeaderOverflowMenu.utils';
import type { BeforeInstallPromptEvent, HeaderOverflowMenuProps, InstallPlatform } from './HeaderOverflowMenu.types';

export type { HeaderOverflowMenuPdfReport, HeaderOverflowMenuProps } from './HeaderOverflowMenu.types';

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
export default function HeaderOverflowMenu({
  showTutorial = true,
  showPdfReport = false,
  pdfReport
}: HeaderOverflowMenuProps) {
  const bumpTourLaunch = useSetTourLaunchRequestWrite();

  const [open, setOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useState(true);
  const [guidePlatform, setGuidePlatform] = useState<InstallPlatform | null>(null);
  /** 마지막 PDF 시도가 성공했나 — 메뉴가 닫힌 뒤에도 라이브 리전이 완료를 알리기 위한 로컬 신호. */
  const [hasPdfReportSucceeded, setHasPdfReportSucceeded] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const guideCloseRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const themePanelId = useId();
  const guideTitleId = useId();
  const pdfCaptionId = useId();

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

  /**
   * PDF 리포트 저장. 생성이 끝날 때까지 **메뉴를 열어 둔다** — 진행 상태(스피너 + role=status)와
   * 실패 알림이 보일 곳이 필요하기 때문이다. 성공했을 때만 닫고 트리거로 포커스를 되돌린다.
   */
  const handleDownloadPdfReport = useCallback(async () => {
    if (!pdfReport) return;
    setHasPdfReportSucceeded(false);
    const succeeded = await pdfReport.onDownload();
    if (!succeeded) return;
    setHasPdfReportSucceeded(true);
    setOpen(false);
    triggerRef.current?.focus();
  }, [pdfReport]);

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
          {/* 튜토리얼·PDF는 "지금 보고 있는 화면"에 대한 액션, 아래 설치·테마는 환경 설정이다. */}
          {showPdfReport && pdfReport ? (
            <>
              <MenuItem
                type="button"
                role="menuitem"
                disabled={pdfReport.isGenerating || pdfReport.blockedReason !== null}
                aria-disabled={pdfReport.isGenerating || pdfReport.blockedReason !== null}
                aria-busy={pdfReport.isGenerating}
                aria-describedby={pdfReport.blockedReason ? pdfCaptionId : undefined}
                onClick={handleDownloadPdfReport}
              >
                <FileText size={16} strokeWidth={1.8} aria-hidden focusable={false} />
                <MenuItemLabel>{pdfReport.isGenerating ? '리포트 만드는 중…' : 'PDF 리포트 저장'}</MenuItemLabel>
                {pdfReport.isGenerating ? (
                  <MenuSpinner aria-hidden="true">
                    <Loader2 size={16} strokeWidth={1.8} focusable={false} />
                  </MenuSpinner>
                ) : null}
              </MenuItem>
              {/* disabled 요소는 title 툴팁이 안 뜬다 → 사유를 본문 캡션으로 두고 aria-describedby로 연결. */}
              {pdfReport.blockedReason ? (
                <MenuCaption id={pdfCaptionId}>{pdfReport.blockedReason}</MenuCaption>
              ) : null}
              {pdfReport.failure && !pdfReport.isGenerating ? (
                <MenuAlert role="alert">
                  <span>{pdfReport.failure.message}</span>
                  {/* 재시도가 의미 없는 실패에는 버튼을 만들지 않는다(같은 결과를 반복시키지 않는다). */}
                  {pdfReport.failure.canRetry ? (
                    <Button variant="secondary" size="sm" onClick={handleDownloadPdfReport}>
                      다시 시도
                    </Button>
                  ) : null}
                </MenuAlert>
              ) : null}
            </>
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

      {/*
        진행/완료/실패를 스피너 회전이 아니라 문장으로 알린다. **메뉴 밖**에 두는 이유:
        성공하면 메뉴가 닫히므로, 메뉴 안에 있으면 "준비됐습니다"가 언마운트되어 낭독되지 않는다.
      */}
      {showPdfReport && pdfReport ? (
        <MenuLiveStatus role="status" aria-live="polite">
          {pdfReport.isGenerating
            ? '리포트를 만들고 있습니다.'
            : pdfReport.failure
              ? '리포트를 만들지 못했습니다.'
              : hasPdfReportSucceeded
                ? '리포트가 준비됐습니다.'
                : ''}
        </MenuLiveStatus>
      ) : null}

      {guidePlatform && modalRoot ? (
        <InstallGuideModal
          platform={guidePlatform}
          titleId={guideTitleId}
          closeButtonRef={guideCloseRef}
          onClose={closeGuide}
          modalRoot={modalRoot}
        />
      ) : null}
    </MenuRoot>
  );
}
