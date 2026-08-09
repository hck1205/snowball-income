import {
  FilePlus,
  FileSpreadsheet,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Table2,
} from "lucide-react";
import { Button, HintText, PickCard } from "@/components/common";
import { LEDGER_COPY } from "../../copy";
import { LedgerStepRail } from "../LedgerStepRail";
import type { LedgerConnectPanelProps } from "./LedgerConnectPanel.types";
import {
  ChoiceBody,
  DualActions,
  ChoiceGrid,
  ChoiceTitle,
  ConnectHeading,
  ConnectSection,
  ConnectStage,
  PrivacyGrid,
  PrivacyHead,
  PrivacyItem,
  PrivacyNote,
  PrivacyTitle,
  StageDivider,
  StageLede,
} from "./LedgerConnectPanel.styled";

const copy = LEDGER_COPY;

/** 고지 네 문장과 그 축을 말하는 글리프. 순서가 곧 읽는 순서다(어디 → 무엇 → 이 기기 → 취소). */
const PRIVACY_FACTS = [
  { text: copy.privacy.where, Glyph: FileSpreadsheet },
  { text: copy.privacy.scope, Glyph: LockKeyhole },
  { text: copy.privacy.local, Glyph: Table2 },
  { text: copy.privacy.revoke, Glyph: KeyRound },
] as const;

/**
 * §4.1 연결 전 화면 — **무대 → 선택 → 고지**.
 *
 * 🔴 **두 선택지의 무게가 같다.** 동일 부품(`PickCard`) · 동일 레일 캡 · 동일 `variant="secondary"`.
 * 어느 쪽도 `primary` 가 아니고 어느 쪽도 텍스트 링크가 아니다. 이 대칭을 깨는 순간(한쪽을 primary
 * 로 올리면) 다른 하나가 종속 선택지로 읽힌다 — 이 화면에 primary 가 **0개**인 것은 의도다.
 *
 * 🔴 카드 자체를 누를 수 있게 만들지 않는다(`onClick` 을 `PickCard` 에 주지 않는다). 두 흐름은
 * 진행 중 표시(`loading`)와 상호 배타적 비활성이 필요한데 그건 버튼만 할 수 있고, 카드와 버튼이
 * 둘 다 눌리면 같은 동작의 진입점이 한 카드에 둘이 된다.
 *
 * 🔴 마스코트는 **이 무대 한 곳**에만 산다. 연결 후 표 화면에는 없다 — 숫자가 사는 면에 캐릭터를
 * 얹으면 데이터의 신뢰감이 깎인다.
 */
export default function LedgerConnectPanel({
  phase,
  headingId,
  isAppSignedIn,
  hasStoredLink,
  onRestoreLastSheet,
  onPickExistingSheet,
  onCreateSheet,
  registerPickButton,
}: LedgerConnectPanelProps) {
  const isPicking = phase === "picking";
  const isCreating = phase === "creating";
  const isBusy = isPicking || isCreating;

  return (
    <ConnectSection aria-labelledby={headingId}>
      <ConnectStage>
        <ConnectHeading id={headingId}>{copy.connect.heading}</ConnectHeading>
        <StageLede>{copy.connect.stageLede}</StageLede>
        <StageDivider aria-hidden />
        {/* 🔴 이 줄은 열 지정 화면과 **같은 부품·같은 라벨**을 쓴다 — 두 화면이 한 흐름임을 말한다. */}
        <LedgerStepRail current={1} tone="panel" />
      </ConnectStage>

      <ChoiceGrid>
        <PickCard
          titleAs="h2"
          /*
            🔴 아이콘이 제목 **위**가 아니라 **같은 줄**에 선다(2026-08-03 사용자 지시).
            종전에는 cap={{kind:"rail"}} 이 6px 레일 + 배지를 제목 위 블록으로 그려, 카드가 아이콘 줄과
            제목 줄로 두 층이 됐다. 선택지가 둘뿐인 화면에서는 그 두 층이 카드 높이만 키웠다.
            ⚠ PickCard 의 title 은 ReactNode 다 — 공용 부품을 고치지 않고 이 화면만 배치를 바꾼다.
          */
          title={
            <ChoiceTitle>
              <FileSpreadsheet size={20} strokeWidth={1.8} aria-hidden focusable={false} />
              {copy.connect.existing.title}
            </ChoiceTitle>
          }
          actions={
            hasStoredLink ? (
              <DualActions>
                {/*
                🔴 **지난 시트로 이어서** — 저장된 연결이 있을 때만 선다(2026-08-09).
                   시트 ID·탭·열 매핑은 이미 로컬에 있고 필요한 것은 토큰뿐인데, 종전에는 그것 하나
                   때문에 피커를 다시 열어 **이미 고른 파일을 또 골라야** 했다.
                ⚠ 타일을 따로 만들지 않고 이 카드 안에 둔다 — 둘 다 "이미 있는 시트를 쓴다"라는
                  한 가지 뜻이고, 갈라 놓으면 선택지가 셋으로 보여 무엇이 다른지 매번 읽어야 한다.
                🔴 마운트에서 자동으로 하지 않는다. 사용자가 아무것도 안 눌렀는데 구글 계정 선택
                   창이 뜨는 것은 팝업이 막히는 것보다 나쁘다(실측으로 되돌린 판단).
              */}
                <Button
                  type="button"
                  fullWidth
                  loading={isPicking}
                  disabled={isBusy && !isPicking}
                  onClick={onRestoreLastSheet}
                >
                  {copy.connect.resume.cta}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  ref={registerPickButton}
                  disabled={isBusy && !isPicking}
                  onClick={onPickExistingSheet}
                >
                  {copy.connect.existing.ctaOther}
                </Button>
              </DualActions>
            ) : (
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
            )
          }
        >
          <ChoiceBody>
            {hasStoredLink ? copy.connect.existing.bodyWithResume : copy.connect.existing.body}
          </ChoiceBody>
        </PickCard>

        <PickCard
          titleAs="h2"
          /*
            🔴 아이콘이 제목 **위**가 아니라 **같은 줄**에 선다(2026-08-03 사용자 지시).
            종전에는 cap={{kind:"rail"}} 이 6px 레일 + 배지를 제목 위 블록으로 그려, 카드가 아이콘 줄과
            제목 줄로 두 층이 됐다. 선택지가 둘뿐인 화면에서는 그 두 층이 카드 높이만 키웠다.
            ⚠ PickCard 의 title 은 ReactNode 다 — 공용 부품을 고치지 않고 이 화면만 배치를 바꾼다.
          */
          title={
            <ChoiceTitle>
              <FilePlus size={20} strokeWidth={1.8} aria-hidden focusable={false} />
              {copy.connect.create.title}
            </ChoiceTitle>
          }
          actions={
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
          }
        >
          <ChoiceBody>{copy.connect.create.body}</ChoiceBody>
        </PickCard>
      </ChoiceGrid>

      <HintText>{copy.connect.consentHint}</HintText>
      {/* 🔴 두 층의 관계를 말하는 문장은 화면 전체에서 이것 하나뿐이다(복제 금지). */}
      {isAppSignedIn ? (
        <HintText>{copy.connect.separateConsentNote}</HintText>
      ) : null}

      {/*
       * 🔴 **권한을 허용하기 전에** 읽히도록 선택지 아래에 세운다. 가계부는 소득·지출이라
       * 이 앱에서 가장 민감한 데이터고, "무엇을 허용하는가"를 판단하는 순간이 바로 여기다.
       * 문구의 정본은 `copy.privacy` 하나뿐이다 — 각주·히어로에 같은 말을 복제하지 마라.
       */}
      <PrivacyNote aria-labelledby="ledger-privacy-title">
        <PrivacyHead>
          <ShieldCheck
            size={20}
            strokeWidth={1.8}
            aria-hidden
            focusable={false}
          />
          <PrivacyTitle id="ledger-privacy-title">
            {copy.privacy.title}
          </PrivacyTitle>
        </PrivacyHead>
        <PrivacyGrid>
          {PRIVACY_FACTS.map(({ text, Glyph }) => (
            <PrivacyItem key={text}>
              <Glyph
                size={16}
                strokeWidth={1.8}
                aria-hidden
                focusable={false}
              />
              <span>{text}</span>
            </PrivacyItem>
          ))}
        </PrivacyGrid>
      </PrivacyNote>
    </ConnectSection>
  );
}
