import { memo, useState } from 'react';
import { Select } from '@/components/common';
import { clampPercent, getTickerDisplayName } from '@/shared/utils';
import type { ReinvestRoutingProps } from './ReinvestRouting.types';
import {
  RoutingArrow,
  RoutingCard,
  RoutingCardList,
  RoutingCardName,
  RoutingCardState,
  RoutingCardTarget,
  RoutingCloseButton,
  RoutingEditor,
  RoutingEditorControls,
  RoutingEditorHead,
  RoutingHeader,
  RoutingNote,
  RoutingPercentField,
  RoutingPercentInput,
  RoutingPercentSuffix,
  RoutingRoot,
  RoutingTitle
} from './ReinvestRouting.styled';

/**
 * **종목별 배당 재투자** — 이 종목의 배당 중 얼마를, 어느 종목에 넣을지.
 *
 * 전역 컨트롤(켬/끔·비율·시점) 바로 아래에 선다. 위의 비율은 **기본값**이고 여기 값이 그것을 덮는다.
 *
 * ## 🔴 평소에는 카드, 누르면 그 자리에서 펼친다 (2026-08-23 사용자 지시)
 * 기본은 "자기 종목에 다시 넣기"이고 그게 대부분의 답이다. 그런데도 줄마다 입력을 세워 두면
 * 아무것도 바꿀 생각이 없는 사용자에게 **종목 수만큼 결정을 요구하는 화면**이 된다. 그래서 평소에는
 * 현재 설정을 요약한 카드만 두고, 누른 카드만 편집기로 늘어난다.
 *
 * 🔴 **카드가 이미 답을 말한다.** 라우팅이 걸린 종목은 접힌 상태에서도 `→ 목적지` 가 보이므로,
 *    공유 링크로 받은 설정이 화면에서 사라지지 않는다. 펼침은 편집을 위한 것이지 확인을 위한 게
 *    아니다 — 그래서 저장된 값이 있다고 강제로 펼치지 않는다.
 *
 * 🔴 **위의 비율이 거짓말하지 않게 한다** (2026-08-23 사용자 지적). 종목 하나라도 기본값과 다르면
 *    "배당 재투자 100%"는 포트폴리오 전체를 설명하지 못한다. 진짜 수정은 **라벨**에 있다 —
 *    그 컨트롤은 이제 `기본 100%` 로 자기가 기본값임을 말한다(`InvestmentSettings` 의
 *    `ReinvestPercentPrefix`). 이 줄은 그 위에 "몇 개가 다른지"를 더해 준다.
 *
 *    가중평균 같은 한 숫자로 뭉개지 않는 이유: 그 가중치가 종목별 배당액이라 시간에 따라 변하고,
 *    화면이 고른 시점을 사용자가 알 수 없다 — 이 레포의 "지어낸 숫자 0" 규칙에 걸린다.
 *
 * 🔴 비율 0% 가 곧 "재투자 안 함"이다 — 목적지에 '안 함' 선택지를 따로 두지 않는다. 두 곳에서
 *    같은 것을 끄게 만들면 "0% 인데 목적지는 SCHD" 같은 모순된 상태가 화면에 남는다.
 *
 * ⚠ 목적지 후보는 **편입된 종목**뿐이다. 담지 않은 종목으로 배당을 보낼 수는 없고, 저장된 값이
 *   그런 종목을 가리키면 정규화 단계에서 버려져 자기 자신으로 떨어진다(`appStateNormalize`).
 */
function ReinvestRoutingComponent({
  includedProfiles,
  percentByTickerId,
  targetByTickerId,
  globalPercent,
  enabled,
  onSetPercent,
  onSetTarget
}: ReinvestRoutingProps) {
  const [openedIds, setOpenedIds] = useState<readonly string[]>([]);

  if (includedProfiles.length === 0) return null;

  const close = (profileId: string) => setOpenedIds((prev) => prev.filter((id) => id !== profileId));
  const open = (profileId: string) => setOpenedIds((prev) => (prev.includes(profileId) ? prev : [...prev, profileId]));

  /* 기본값과 다른 종목의 수 — 비율이 다르거나, 다른 종목으로 보내거나. */
  const customizedCount = includedProfiles.filter(
    (profile) =>
      (percentByTickerId[profile.id] ?? globalPercent) !== globalPercent ||
      (targetByTickerId[profile.id] ?? profile.id) !== profile.id
  ).length;

  return (
    <RoutingRoot>
      <RoutingHeader>
        <RoutingTitle>종목별 재투자</RoutingTitle>
        <RoutingNote>
          {customizedCount > 0
            ? `${customizedCount}개 종목이 기본값과 다르게 설정돼 있습니다.`
            : '기본은 그 종목에 다시 넣습니다. 바꿀 종목을 눌러 펼치세요.'}
        </RoutingNote>
      </RoutingHeader>
      <RoutingCardList>
        {includedProfiles.map((profile) => {
          const displayName = getTickerDisplayName(profile.ticker, profile.name);
          /* 종목별 값이 없으면 전역값을 그대로 보여 준다 — 빈칸이면 "0%" 로 오해된다. */
          const percent = percentByTickerId[profile.id] ?? globalPercent;
          const targetId = targetByTickerId[profile.id] ?? profile.id;
          const targetProfile = includedProfiles.find((item) => item.id === targetId);
          const isRouted = targetId !== profile.id;
          const hasNothingToSend = percent <= 0;

          if (!openedIds.includes(profile.id)) {
            return (
              <RoutingCard
                key={profile.id}
                type="button"
                routed={isRouted}
                disabled={!enabled}
                onClick={() => open(profile.id)}
              >
                <RoutingCardName>{displayName}</RoutingCardName>
                <RoutingCardState>
                  {`재투자 ${percent}%`}
                  {isRouted && targetProfile ? (
                    <RoutingCardTarget>{`→ ${getTickerDisplayName(targetProfile.ticker, targetProfile.name)}`}</RoutingCardTarget>
                  ) : null}
                </RoutingCardState>
              </RoutingCard>
            );
          }

          return (
            <RoutingEditor key={profile.id}>
              <RoutingEditorHead>
                <RoutingCardName>{displayName}</RoutingCardName>
                <RoutingCloseButton
                  type="button"
                  aria-label={`${displayName} 배당 재투자 설정 접기`}
                  onClick={() => close(profile.id)}
                >
                  ×
                </RoutingCloseButton>
              </RoutingEditorHead>
              <RoutingEditorControls>
                <RoutingPercentField>
                  <RoutingPercentInput
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    aria-label={`${displayName} 배당 재투자 비율`}
                    value={percent}
                    disabled={!enabled}
                    onChange={(event) => onSetPercent(profile.id, clampPercent(Number(event.target.value)))}
                  />
                  <RoutingPercentSuffix aria-hidden>%</RoutingPercentSuffix>
                </RoutingPercentField>
                {/* 화살표가 "보낼 곳"을 대신한다 — 좁은 설정 패널에서 글자 라벨까지 세우면 줄이 터진다.
                    접근성 이름은 셀렉트 자신이 갖고 있다. */}
                <RoutingArrow aria-hidden>→</RoutingArrow>
                <Select
                  aria-label={`${displayName} 배당을 보낼 종목`}
                  /* 🔴 기본값(lg 40px · width 100%)을 쓰면 카드 안에서 줄이 터진다. */
                  size="sm"
                  width="auto"
                  minWidth="88px"
                  value={targetId}
                  disabled={!enabled || hasNothingToSend}
                  onChange={(event) => onSetTarget(profile.id, event.target.value)}
                >
                  {includedProfiles.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {getTickerDisplayName(candidate.ticker, candidate.name)}
                    </option>
                  ))}
                </Select>
              </RoutingEditorControls>
            </RoutingEditor>
          );
        })}
      </RoutingCardList>
    </RoutingRoot>
  );
}

const ReinvestRouting = memo(ReinvestRoutingComponent);

export default ReinvestRouting;
