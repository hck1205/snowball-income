import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components';
import { MODAL_EXIT_MS, ModalActions, ModalBackdrop, ModalBody, ModalPanel, ModalTitle } from '@/components/common';
import { useCurrentHelpAtomValue } from '@/jotai';
import { useDrawerBackClose, useOverlayEscape, useOverlayPresence } from '@/shared/hooks';
import type { HelpModalProps } from './HelpModal.types';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { HelpBulletIcon, HelpBulletList } from './HelpModal.styled';

const renderWithBoldTokens = (text: string, tokens: string[]) => {
  if (tokens.length === 0) return text;

  const escaped = tokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'g');
  const parts = text.split(pattern);

  return parts.map((part, index) =>
    tokens.includes(part) ? (
      <strong key={`${part}-${index}`}>{part}</strong>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  );
};

const renderPortfolioTabsHelpBody = (body: string) => {
  const lines = body
    .split('\n')
    .map((line) => line.replace(/^•\s*/, '').trim())
    .filter(Boolean);

  return (
    <ModalBody as="div">
      <HelpBulletList>
        {lines.map((line, index) => {
          const boldTokens = index === 0 ? ['10개'] : index === 1 ? ['이름 변경', '삭제'] : ['드래그', '순서'];

          if (index !== 0) return <li key={`${index}-${line}`}>{renderWithBoldTokens(line, boldTokens)}</li>;

          const normalizedLine = line.replace(/^\+\s*/, '');

          return (
            <li key={`${index}-${line}`}>
              <HelpBulletIcon aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 24 24" focusable="false">
                  <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </HelpBulletIcon>
              {renderWithBoldTokens(normalizedLine, boldTokens)}
            </li>
          );
        })}
      </HelpBulletList>
    </ModalBody>
  );
};

export default function HelpModal({ onBackdropClick, onClose }: HelpModalProps) {
  const help = useCurrentHelpAtomValue();
  /*
   * 닫힌 뒤 `MODAL_EXIT_MS` 동안 마지막 도움말을 붙잡아 퇴장 모션을 그린다.
   * 🔴 아래 `useOverlayEscape`/`useDrawerBackClose` 에는 **잔류값이 아니라 `help`** 를 넘긴다 —
   *   퇴장 동안 오버레이 스택에 남아 있으면 그 사이의 Escape 가 이미 닫힌 층에게 먹혀
   *   뒤의 드로어까지 함께 닫힌다(가드 test/main/overlayEscapeNesting.test.tsx).
   */
  const { value: shownHelp, phase } = useOverlayPresence(help, MODAL_EXIT_MS);
  const titleId = useId();
  const modalRoot = typeof document !== 'undefined' ? document.body : null;

  /*
   * Escape = 도움말 닫기. 도움말은 설정 드로어 안 물음표에서도 열리므로 **한 겹만** 닫혀야 한다
   * (직접 window 리스너를 달면 드로어의 document 리스너가 먼저 돌아 둘이 함께 닫힌다).
   */
  useOverlayEscape(Boolean(help), onClose);

  /*
   * 뒤로가기 = 도움말만 닫기. Escape 와 **같은 층 판정**을 쓴다(2026-07-30) — 그 전에는 이 모달이
   * 뒤로가기 스택 밖에 있어서, 설정 드로어 안 물음표로 도움말을 띄우고 기기 뒤로가기를 누르면
   * 도움말은 남고 **뒤의 드로어가 닫혔다**. 두 제스처는 서로 다른 훅이 맡으므로 한쪽만 배선하면
   * 이렇게 갈라진다.
   */
  useDrawerBackClose(Boolean(help), onClose);

  /*
   * 🔴 **닫는 순간 포커스를 열기 트리거로 되돌린다.** 두 가지를 동시에 고친다(2026-07-31 리뷰 m3).
   *  ① 퇴장 120ms 동안 이 서브트리는 `aria-hidden="true"` 인데, 사용자가 '닫기' 버튼을 눌러
   *    닫았다면 `document.activeElement` 가 **그 감춰진 서브트리 안**에 남는다(axe `aria-hidden-focus`).
   *  ② 그 뒤 트리가 사라지면 포커스가 `<body>` 로 떨어져, 키보드 사용자는 문서 맨 처음부터
   *    다시 탭해 내려와야 한다.
   *
   * ⚠ deps 는 `[help]` 뿐이다 — `onClose` 를 넣으면 호출부의 인라인 화살표 때문에 부모가 리렌더될
   *   때마다 cleanup 이 돌아 **도움말이 열려 있는 중에** 포커스를 빼앗는다(pitfalls 2026-07-29).
   */
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!help) return undefined;
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    return () => {
      const trigger = restoreFocusRef.current;
      restoreFocusRef.current = null;
      // 트리거가 그 사이 사라졌으면(드로어가 함께 닫히는 등) 아무 일도 하지 않는다.
      if (trigger?.isConnected) trigger.focus();
    };
  }, [help]);

  useEffect(() => {
    if (!help) return;
    trackEvent(ANALYTICS_EVENT.MODAL_VIEW, {
      modal_type: 'help_modal',
      help_title: help.title
    });
  }, [help]);

  if (!shownHelp) return null;
  if (!modalRoot) return null;

  /*
   * 🔴 퇴장 중인 껍데기는 **다이얼로그가 아니다.** 닫기를 누른 순간 이 모달은 논리적으로 사라졌고
   * 남은 120ms 는 순수한 장식이다 — `role="dialog"` 를 그대로 두면 보조기기가 "닫았는데 아직
   * 열려 있는 대화상자"를 읽고, 다음 오버레이가 그 사이에 열리면 다이얼로그가 두 개로 보인다.
   */
  const isExiting = phase === 'exit';

  return createPortal(
    <ModalBackdrop
      role={isExiting ? undefined : 'dialog'}
      aria-modal={isExiting ? undefined : 'true'}
      aria-labelledby={isExiting ? undefined : titleId}
      aria-hidden={isExiting ? 'true' : undefined}
      onClick={isExiting ? undefined : onBackdropClick}
      $phase={phase}
    >
      <ModalPanel $phase={phase}>
        <ModalTitle id={titleId}>{shownHelp.title}</ModalTitle>
        {shownHelp.title === '포트폴리오 탭' ? (
          renderPortfolioTabsHelpBody(shownHelp.body)
        ) : (
          <ModalBody>{shownHelp.body}</ModalBody>
        )}
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
        </ModalActions>
      </ModalPanel>
    </ModalBackdrop>,
    modalRoot
  );
}
