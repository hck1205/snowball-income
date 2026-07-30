import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDrawerBackClose, useOverlayEscape } from '@/shared/hooks';
import Button from '../Button';
import { ModalActions, ModalBackdrop, ModalPanel, ModalTitle } from '../Modal';
import ShareChannelGlyph from './ShareChannelGlyph';
import type { ShareDialogProps } from './ShareDialog.types';
import { SHARE_CHANNELS, SHARE_DIALOG_COPY } from './ShareDialog.utils';
import {
  ShareBody,
  ShareChannelButton,
  ShareChannelList,
  ShareLinkInput,
  ShareLinkLabel,
  ShareLinkRow,
  ShareSection,
  ShareSectionLabel
} from './ShareDialog.styled';

const copy = SHARE_DIALOG_COPY;

/**
 * 데스크톱 공유 창.
 *
 * **왜 OS 공유 시트가 아닌가**: `navigator.share` 는 데스크톱 브라우저(Windows Chrome·Edge)에도
 * 있지만, 호출하면 운영체제가 그리는 창이 뜬다 — 크기·위치를 앱이 손댈 수 없고 잘려 보인다는
 * 신고가 이 부품의 출발점이었다. 그래서 마우스가 있는 화면에서는 이 창을 쓰고 터치 기기에서만
 * OS 시트에 위임한다(`isNativeShareIdiomatic`).
 *
 * **왜 앵커 팝오버가 아닌가**: 이 앱의 공유 버튼은 드로어 안(설정)·카드 안(피드)·본문 하단(상세)
 * 어디에나 있고 그 조상들이 `container-type`·`contain`·`overflow` 를 갖는다. 앵커 팝오버는 그
 * 컨테인먼트에 걸려 **다시 잘린다**. 화면 중앙에 뜨는 창은 조상이 무엇이든 잘리지 않는다.
 *
 * 1급 동작은 **링크 복사**다. 채널 버튼은 그 아래 보조 줄이고, 주소는 읽기 전용 입력으로 항상
 * 보여 준다(클립보드가 막힌 환경에서도 직접 선택해 복사할 수 있어야 공유가 성립한다).
 *
 * ⚠ 포커스 이펙트는 **열림 전이에만** 돈다(deps 없음 = 마운트/언마운트 1회). `onClose` 를 deps 에
 *   두면 인라인 화살표를 넘기는 호출부(TickerCreation)에서 부모가 리렌더될 때마다 정리가 돌아
 *   `restore.focus()` 가 **주소를 드래그 선택하던 중에** 포커스를 빼앗는다 — 그 부모는 2.2초 토스트
 *   타이머로 스스로 리렌더된다. 클립보드가 막힌 사용자의 수동 복사가 이 창의 존재 이유라 치명적이다.
 *   같은 함정을 `SideDrawer`·`HoldingPickerDrawer` 는 `onCloseRef` 로 막아 뒀다(qa BUG-1).
 */
export default function ShareDialog({
  url,
  onCopy,
  onSelectChannel,
  onClose,
  isCopied = false
}: ShareDialogProps) {
  const titleId = useId();
  const linkId = useId();
  const copyRef = useRef<HTMLButtonElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const root = typeof document !== 'undefined' ? document.body : null;

  // Escape = 닫기. 이 창은 설정 드로어 위에 열리므로 **한 겹만** 닫혀야 한다(스택이 순서를 정한다).
  useOverlayEscape(true, onClose);

  /*
   * 뒤로가기 = 이 창만 닫기. **Escape 와 짝을 맞춘 것**이다(2026-07-30) — 그 전에는 이 창이
   * `useOverlayEscape` 에만 참여해서, 설정 드로어 위에 이 창을 띄우고 기기 뒤로가기를 누르면
   * 이 창은 그대로 남고 **뒤의 드로어가 닫혔다**(사용자가 기대하는 것과 정확히 반대).
   * 이 부품은 열릴 때만 마운트되므로 열림 인자는 상수 `true` 다(위 `useOverlayEscape` 와 같은 이유).
   * 닫을 때 훅이 자기 엔트리를 되감으므로 히스토리 길이는 열기 전과 같다 — 채널 버튼은
   * `window.open(_blank)` 이라 이 탭의 히스토리를 건드리지 않는다.
   */
  useDrawerBackClose(true, onClose);

  useEffect(() => {
    restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // 1급 동작(링크 복사)에 포커스를 둔다 — 키보드 사용자는 창이 열리자마자 Enter 로 끝낼 수 있다.
    copyRef.current?.focus();

    return () => {
      // 닫은 뒤 포커스가 body 로 떨어지면 키보드 사용자는 위치를 잃는다 — 열었던 버튼으로 돌린다.
      const restore = restoreRef.current;
      if (restore && restore.isConnected) restore.focus();
    };
    // deps 는 비어 있어야 한다 — 위 ⚠ 참조. `onClose` 를 넣으면 리렌더마다 포커스를 빼앗는다.
  }, []);

  if (!root) return null;

  return createPortal(
    <ModalBackdrop
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(event) => {
        /*
         * 🔴 여기서 전파를 끊는 이유 — React 포털은 **DOM 트리가 아니라 React 트리**를 따라
         * 이벤트를 버블시킨다. 이 창은 `document.body` 로 포털되지만 React 상으로는 여전히
         * 호출부의 자식이고, 피드에서는 그 호출부(`PostShareButton`)가 **카드 전체를 감싼
         * `<Link>` 안**에 있다. 그래서 창 안의 클릭(닫기·복사·채널·백드롭)이 링크의 onClick 에
         * 닿아 **닫는 순간 글 상세로 이동하는** 버그가 났다(사용자 신고, 2026-07-31).
         * 여는 쪽은 `PostShareButton` 이 자기 클릭에 preventDefault+stopPropagation 을 걸어
         * 멀쩡했기 때문에 "열면 정상, 닫으면 이동"으로 나타났다.
         *
         * 포털 루트 한 곳에서 끊으면 이 창을 쓰는 **모든 호출부**가 같은 보호를 받는다.
         * 아래 백드롭 판정보다 **먼저** 와야 한다 — 패널 안쪽 클릭은 여기서 조기 반환하므로
         * 그 뒤에 두면 정작 닫기 버튼의 전파를 못 막는다.
         */
        event.stopPropagation();
        // 패널 안쪽에서 시작한 클릭(주소 드래그 선택 등)으로 닫히지 않게 백드롭 자신만 본다.
        if (event.target !== event.currentTarget) return;
        onClose();
      }}
    >
      <ModalPanel>
        <ModalTitle id={titleId}>{copy.title}</ModalTitle>
        <ShareBody>
          <ShareSection>
            <ShareLinkLabel htmlFor={linkId}>{copy.linkLabel}</ShareLinkLabel>
            <ShareLinkRow>
              <ShareLinkInput
                id={linkId}
                type="text"
                readOnly
                value={url}
                onFocus={(event) => event.currentTarget.select()}
              />
              <Button ref={copyRef} type="button" variant="primary" onClick={() => void onCopy()}>
                {isCopied ? copy.copied : copy.copy}
              </Button>
            </ShareLinkRow>
          </ShareSection>

          <ShareSection>
            <ShareSectionLabel>{copy.channelsLabel}</ShareSectionLabel>
            <ShareChannelList>
              {SHARE_CHANNELS.map((channel) => (
                <li key={channel.id}>
                  <ShareChannelButton
                    type="button"
                    aria-label={copy.channelAria(channel.label)}
                    onClick={() => onSelectChannel(channel.id)}
                  >
                    <ShareChannelGlyph channel={channel.id} />
                    <span>{channel.label}</span>
                  </ShareChannelButton>
                </li>
              ))}
            </ShareChannelList>
          </ShareSection>
        </ShareBody>
        <ModalActions>
          <Button type="button" variant="secondary" onClick={onClose}>
            {copy.close}
          </Button>
        </ModalActions>
      </ModalPanel>
    </ModalBackdrop>,
    root
  );
}
