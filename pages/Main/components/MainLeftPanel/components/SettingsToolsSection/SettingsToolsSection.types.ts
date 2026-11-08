import type { ShareLinkResult } from '@/pages/Main/hooks';

/* 정본은 `useShareLinkCreator` 옆이다(2026-11-09) — 기존 import 경로를 위해 다시 내보낸다. */
export type { ShareLinkResult };

export type SettingsToolsSectionProps = {
  /** 지금 상태를 압축 URL로 만들어 클립보드에 넣는다. 복사가 막히면 `copied:false` 로 돌아온다. */
  onCreateShareLink: () => Promise<ShareLinkResult>;
};
