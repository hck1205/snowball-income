/** 주소 하나로 여는 공개 공유 인텐트만 다룬다(SDK·앱키가 필요한 채널은 목록에 없다). */
export type ShareChannelId = 'x' | 'facebook' | 'naver';

export type ShareChannel = {
  id: ShareChannelId;
  /** 사람이 읽는 이름. 접근명·툴팁이 이 값을 쓴다. */
  label: string;
  buildUrl: (url: string, title: string) => string;
};

export type ShareDialogProps = {
  /** 공유할 공개 주소. 사용자가 직접 선택해 복사할 수 있게 화면에도 그대로 보여 준다. */
  url: string;
  /** "링크 복사". 복사 성공/실패는 호출부가 토스트로 알린다. */
  onCopy: () => void | Promise<void>;
  /** 채널 버튼. 호출부가 계측하고 새 창을 연다. */
  onSelectChannel: (channel: ShareChannelId) => void;
  onClose: () => void;
  /** 복사 직후 버튼 라벨을 "복사했습니다"로 바꿀지 — 호출부가 토스트와 같은 신호로 넘긴다. */
  isCopied?: boolean;
};
