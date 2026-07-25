import type { InstallPlatform } from './HeaderOverflowMenu.types';

/** 이미 홈화면/앱(standalone)으로 실행 중인가. */
export const isRunningStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  const displayModeStandalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return displayModeStandalone || iosStandalone;
};

/** 수동 설치 가이드용 플랫폼 판정 — 네이티브 프롬프트가 없을 때만 쓰인다. */
export const detectInstallPlatform = (): InstallPlatform => {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  // iPadOS 13+ 는 데스크톱 Mac UA로 위장한다 — 터치 포인트로 구분한다.
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
};
