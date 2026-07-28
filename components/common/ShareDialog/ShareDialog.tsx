import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
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

  useEffect(() => {
    restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // 1급 동작(링크 복사)에 포커스를 둔다 — 키보드 사용자는 창이 열리자마자 Enter 로 끝낼 수 있다.
    copyRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      onClose();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // 닫은 뒤 포커스가 body 로 떨어지면 키보드 사용자는 위치를 잃는다 — 열었던 버튼으로 돌린다.
      const restore = restoreRef.current;
      if (restore && restore.isConnected) restore.focus();
    };
  }, [onClose]);

  if (!root) return null;

  return createPortal(
    <ModalBackdrop
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(event) => {
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
