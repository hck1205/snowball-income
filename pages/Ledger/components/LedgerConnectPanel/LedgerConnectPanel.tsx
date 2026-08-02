import { Button, Card, HintText } from '@/components/common';
import { LEDGER_COPY } from '../../copy';
import type { LedgerConnectPanelProps } from './LedgerConnectPanel.types';
import {
  ChoiceBody,
  ConnectGrid,
  ConnectHeading,
  ConnectSection,
  PrivacyList,
  PrivacyNote,
  PrivacyTitle
} from './LedgerConnectPanel.styled';

const copy = LEDGER_COPY;

/**
 * §4.1 연결 전 빈 상태 — **두 선택지의 무게가 같다.**
 *
 * 🔴 동일 마크업 · 동일 `tone="wash"` · 동일 `variant="secondary"`. 어느 쪽도 `primary` 가 아니고
 * 어느 쪽도 텍스트 링크가 아니다. 이 대칭을 깨는 순간(한쪽을 primary 로 올리면) 다른 하나가
 * 종속 선택지로 읽힌다 — 이 화면에 primary 가 **0개**인 것은 의도다.
 *
 * 🔴 설명문은 `Card` 의 `subtitle` 이 아니라 children 에 둔다(`CardSubtitle` 은 12px/textMuted
 * 캡션이라 두 줄짜리 설명문에는 너무 작다). ⚠ `CardContainer` 는 grid 가 아니라 일반 블록이라
 * 자식 간 간격은 `ChoiceBody` 의 마진이 만든다.
 */
export default function LedgerConnectPanel({
  phase,
  headingId,
  isAppSignedIn,
  onPickExistingSheet,
  onCreateSheet,
  registerPickButton
}: LedgerConnectPanelProps) {
  const isPicking = phase === 'picking';
  const isCreating = phase === 'creating';
  const isBusy = isPicking || isCreating;

  return (
    <ConnectSection aria-labelledby={headingId}>
      <ConnectHeading id={headingId}>{copy.connect.heading}</ConnectHeading>

      <ConnectGrid>
        <Card tone="wash" title={copy.connect.existing.title}>
          <ChoiceBody>{copy.connect.existing.body}</ChoiceBody>
          <Button
            type="button"
            variant="secondary"
            fullWidth
            ref={registerPickButton}
            loading={isPicking}
            disabled={isBusy && !isPicking}
            onClick={onPickExistingSheet}
          >
            {copy.connect.existing.cta}
          </Button>
        </Card>

        <Card tone="wash" title={copy.connect.create.title}>
          <ChoiceBody>{copy.connect.create.body}</ChoiceBody>
          <Button
            type="button"
            variant="secondary"
            fullWidth
            loading={isCreating}
            disabled={isBusy && !isCreating}
            onClick={onCreateSheet}
          >
            {copy.connect.create.cta}
          </Button>
        </Card>
      </ConnectGrid>

      <HintText>{copy.connect.consentHint}</HintText>
      {/* 🔴 두 층의 관계를 말하는 문장은 화면 전체에서 이것 하나뿐이다(복제 금지). */}
      {isAppSignedIn ? <HintText>{copy.connect.separateConsentNote}</HintText> : null}

      {/*
       * 🔴 **권한을 허용하기 전에** 읽히도록 선택지 아래에 세운다. 가계부는 소득·지출이라
       * 이 앱에서 가장 민감한 데이터고, "무엇을 허용하는가"를 판단하는 순간이 바로 여기다.
       * 문구의 정본은 `copy.privacy` 하나뿐이다 — 각주·히어로에 같은 말을 복제하지 마라.
       */}
      <PrivacyNote aria-labelledby="ledger-privacy-title">
        <PrivacyTitle id="ledger-privacy-title">{copy.privacy.title}</PrivacyTitle>
        <PrivacyList>
          <li>{copy.privacy.where}</li>
          <li>{copy.privacy.scope}</li>
          <li>{copy.privacy.local}</li>
          <li>{copy.privacy.revoke}</li>
        </PrivacyList>
      </PrivacyNote>
    </ConnectSection>
  );
}
