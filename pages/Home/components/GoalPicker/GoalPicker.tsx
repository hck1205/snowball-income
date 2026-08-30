import { useMemo } from 'react';
import { Info } from 'lucide-react';
import { LANDING_ASSET_GOALS, LANDING_DIVIDEND_GOALS, type LandingGoalKind } from '@/shared/constants/landingGoals';
import { ICON } from '@/shared/styles';
import { HOME_COPY } from '../../copy';
import { buildGoalAssumptions, buildGoalCards } from './GoalPicker.utils';
import {
  AssumptionCard,
  AssumptionChip,
  AssumptionChips,
  AssumptionLabel,
  GoalBadge,
  GoalCaption,
  GoalCard,
  GoalGrid,
  GoalGroup,
  GoalItem,
  GoalLabel,
  GoalPreviewBlock,
  GoalPreviewLead,
  GoalPreviewValue,
  GoalRule,
  GroupHead,
  GroupHint,
  PickerRoot
} from './GoalPicker.styled';
import type { GoalCardModel, GoalPickerProps } from './GoalPicker.types';

/**
 * 첫 화면의 **목표 여섯**.
 *
 * ## 🔴 `Link` 다 (버튼 + navigate 가 아니다)
 * 콜백은 **계측만** 한다. 이동은 `Link` 가 하므로 가운데 클릭·`Cmd+클릭`·"새 탭에서 열기"·주소
 * 미리보기가 전부 살아 있다 — `onClick` 에서 `navigate()` 를 부르면 그것들이 조용히 죽는다
 * (`LevelPicker` 가 같은 이유로 같은 형태다).
 *
 * ## 🔴 묶음마다 `section` + `h2` 다
 * 자산 셋과 배당 셋은 **성격이 다른 두 목록**이라, 화면 낭독기에게도 그렇게 들려야 한다.
 * 하나의 `ul` 여섯 항목으로 합치면 "목표 여섯 개" 로만 들리고 자산·배당의 구분이 사라진다.
 * ⚠ 이 화면의 `h1` 은 `PageHero` 가 갖는다 — 여기 머리는 `h2` 여야 문서 개요가 깨지지 않는다.
 *
 * ## 색은 묶음이 소유한다
 * `tone` 하나가 묶음 머리·카드·배지·값에 함께 흐른다. 🔴 카드마다 다른 색을 주지 마라 —
 * 이유는 `GoalPicker.styled.ts` 머리말(위계가 아니라 소음이 되고, 목표를 권하는 것처럼 보인다).
 *
 * ⚠ 문구·목표값은 `shared/constants/landingGoals` 와 `HOME_COPY` 가 소유한다. 여기서 다시 적지 마라.
 */
export default function GoalPicker({ onSelectGoal }: GoalPickerProps) {
  // 여섯 장 전부 순수 산수라 값이 변하지 않는다 — 렌더마다 다시 만들 이유가 없다.
  const assetCards = useMemo(() => buildGoalCards(LANDING_ASSET_GOALS), []);
  const dividendCards = useMemo(() => buildGoalCards(LANDING_DIVIDEND_GOALS), []);
  const assumptions = useMemo(() => buildGoalAssumptions(), []);

  return (
    <PickerRoot>
      <GoalGroupBlock
        tone="asset"
        label={HOME_COPY.groups.asset.label}
        hint={HOME_COPY.groups.asset.hint}
        cards={assetCards}
        onSelectGoal={onSelectGoal}
      />
      <GoalGroupBlock
        tone="dividend"
        label={HOME_COPY.groups.dividend.label}
        hint={HOME_COPY.groups.dividend.hint}
        cards={dividendCards}
        onSelectGoal={onSelectGoal}
      />

      {/* 🔴 접거나 숨기지 않는다 — 카드의 숫자가 전부 이 가정에서 나온다(styled 주석의 이유). */}
      <AssumptionCard>
        <AssumptionLabel>
          <Info size={ICON.xs} strokeWidth={2} aria-hidden focusable={false} />
          {HOME_COPY.assumptionsPrefix}
        </AssumptionLabel>
        <AssumptionChips>
          {assumptions.map(({ label, value }) => (
            <AssumptionChip key={label}>
              {label} <b>{value}</b>
            </AssumptionChip>
          ))}
        </AssumptionChips>
      </AssumptionCard>
    </PickerRoot>
  );
}

type GoalGroupBlockProps = {
  tone: LandingGoalKind;
  label: string;
  hint: string;
  cards: GoalCardModel[];
} & GoalPickerProps;

/** 묶음 하나(라벨 + 3칸). 자산·배당이 **같은 형태**임을 코드로 못박는다 — 한쪽만 손대는 사고를 막는다. */
function GoalGroupBlock({ tone, label, hint, cards, onSelectGoal }: GoalGroupBlockProps) {
  return (
    <GoalGroup>
      <GroupHead tone={tone}>
        {label}
        <GroupHint>{hint}</GroupHint>
      </GroupHead>
      <GoalGrid>
        {cards.map(({ goal, to, preview, Icon }) => (
          <GoalItem key={goal.id}>
            <GoalCard
              tone={tone}
              to={to}
              /* 접힘 위 프로브와 테스트가 이 속성으로 카드를 찾는다 — 배열 순서가 바뀌어도 같은 곳이다. */
              data-home-goal={goal.id}
              onClick={() => onSelectGoal(goal)}
            >
              <GoalBadge tone={tone}>
                <Icon size={ICON.md} strokeWidth={2} aria-hidden focusable={false} />
              </GoalBadge>
              <GoalLabel>{goal.label}</GoalLabel>
              {/* 계산이 안 되면 답 블록 자체를 그리지 않는다(빈 자리를 남기면 카드 높이가 들쭉날쭉해진다). */}
              {preview === null ? null : (
                <>
                  <GoalRule tone={tone} />
                  <GoalPreviewBlock>
                    <GoalPreviewLead>{preview.lead}</GoalPreviewLead>
                    <GoalPreviewValue tone={tone}>{preview.value}</GoalPreviewValue>
                  </GoalPreviewBlock>
                </>
              )}
              <GoalCaption>{goal.caption}</GoalCaption>
            </GoalCard>
          </GoalItem>
        ))}
      </GoalGrid>
    </GoalGroup>
  );
}
