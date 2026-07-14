export type ModelChangeNoticeProps = {
  /**
   * 닫힘 상태를 기록할 localStorage 키. 기본값은 이 공지의 버전 키
   * (`MODEL_CHANGE_NOTICE_STORAGE_KEY`). 다음 공지를 띄울 때 키만 바꿔 재사용할 수 있게 열어 둔다.
   */
  storageKey?: string;
};
