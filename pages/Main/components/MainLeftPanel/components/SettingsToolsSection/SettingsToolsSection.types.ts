export type ShareLinkResult = { ok: true; url: string; copied: boolean } | { ok: false; message: string };

export type SettingsToolsSectionProps = {
  /** 지금 상태를 압축 URL로 만들어 클립보드에 넣는다. 복사가 막히면 `copied:false` 로 돌아온다. */
  onCreateShareLink: () => Promise<ShareLinkResult>;
};
