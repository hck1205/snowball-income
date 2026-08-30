import {
  CircleDollarSign,
  Info,
  LayoutList,
  Plus
} from 'lucide-react';
import {
  Button,
  StatTile
} from '@/components/common';
import {
  HoldingsComposition,
  HoldingsTable,
  MonthlyRecap
} from '../';
import {
  ActionHint,
  ActionRow,
  CardDivider,
  CardHead,
  CardHeadPlain,
  CardSubtitle,
  CardTitle,
  CardTitleBadge,
  CardTitleGroup,
  CountBadge,
  ExcludedNote,
  FigureHint,
  FigureList,
  FigureRow,
  FigureTerm,
  FigureValue,
  HeroMascot,
  HeroSlot,
  HoldingsCard,
  MainColumn,
  NoteLine,
  RailColumn,
  SkeletonBar,
  SkeletonCell,
  SkeletonList,
  SkeletonRow,
  SummaryCard,
  Workbench
} from '../../PortfolioPage/styled';
import { useId } from 'react';
import { ICON } from '@/shared/styles';
import { PORTFOLIO_COPY } from '../../copy';
import type { PortfolioWorkbenchProps } from './PortfolioWorkbench.types';

/** 로딩 골격의 줄·칸 수. 쓰는 곳이 이 부품뿐이라 함께 데려왔다(2026-08-31). */
const SKELETON_ROWS = [0, 1, 2];
const SKELETON_CELLS = [0, 1, 2, 3];

const copy = PORTFOLIO_COPY;

/**
 * 내 포트폴리오의 **작업대** — 보유 목록(본단) + 요약 레일.
 *
 * ## 왜 갈랐나 (2026-08-31 리팩터)
 * `PortfolioPageView` 는 658줄이었고 그중 165줄이 이 블록이었다. 히어로·배너·서랍 같은 화면 껍데기와
 * 나란히 있어서 "지금 이 코드가 목록 얘기인가 화면 얘기인가"를 매번 되짚어야 했다.
 *
 * 🔴 **표 안의 포커스 ref 는 부모가 갖는다.** 지우기·되돌리기의 포커스 복구가 이 블록 **밖**
 * (되돌리기 배너·빈 상태 추가 버튼)과 같은 맵을 봐야 해서다 — 여기로 내리면 두 벌이 되고,
 * 그 순간 "지운 뒤 다음 행으로" 가 조용히 깨진다. 그래서 등록 함수만 내려받는다.
 *
 * ⚠ 마운트 여부(보유가 있는가)는 **호출부가 정한다.** 여기서 다시 판단하면 조건이 두 곳이 된다.
 */
export default function PortfolioWorkbench({
  viewModel,
  goalCard,
  onOpenPicker,
  onQuantityChange,
  onQuantityBlur,
  onRemove,
  onSimulate,
  registerQuantityInput,
  registerDeleteButton,
  addButtonRef,
  isPickerOpen,
  drawerId
}: PortfolioWorkbenchProps) {
  const summaryTitleId = useId();
  const holdingsTitleId = useId();
  const hintIdPrefix = useId();
  /* 계산해 보기 버튼이 비활성일 때 그 사유를 가리킨다(무음 비활성 금지). */
  const simulateHintId = `${hintIdPrefix}-simulate-hint`;
  /* 비중이 0 인 행뿐이면 구성 그림을 그리지 않는다 — 빈 원은 정보가 아니다. */
  const showComposition = !viewModel.isLoading && viewModel.rows.some((row) => (row.weightPercent ?? 0) > 0);

  return (
    <Workbench>
      <MainColumn>
        <HoldingsCard aria-labelledby={holdingsTitleId} aria-busy={viewModel.isLoading || undefined}>
          <CardHead>
            <CardTitleGroup>
              <CardTitle id={holdingsTitleId}>
                <CardTitleBadge aria-hidden>
                  <LayoutList size={ICON.md} strokeWidth={ICON.stroke} focusable={false} />
                </CardTitleBadge>
                {copy.holdings.title}
              </CardTitle>
              {viewModel.holdingsCount > 0 ? (
                <CountBadge>{copy.holdings.countBadge(viewModel.holdingsCount)}</CountBadge>
              ) : null}
            </CardTitleGroup>
            {/* 저장소를 읽는 동안에는 추가를 받지 않는다(훅이 거절한다) — 버튼도 그 사실을 보인다. */}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              ref={addButtonRef}
              disabled={viewModel.isLoading}
              aria-expanded={isPickerOpen}
              aria-controls={drawerId}
              aria-label={copy.holdings.addAria(viewModel.holdingsCount)}
              startIcon={<Plus size={16} strokeWidth={1.8} aria-hidden focusable={false} />}
              onClick={onOpenPicker}
            >
              {copy.holdings.add}
            </Button>
          </CardHead>

          {viewModel.isLoading ? (
            <SkeletonList aria-hidden>
              {SKELETON_ROWS.map((row) => (
                <SkeletonRow key={row}>
                  {SKELETON_CELLS.map((cell) => (
                    <SkeletonCell key={cell} />
                  ))}
                </SkeletonRow>
              ))}
            </SkeletonList>
          ) : (
            <HoldingsTable
              rows={viewModel.rows}
              onQuantityChange={onQuantityChange}
              onQuantityBlur={onQuantityBlur}
              onRemove={onRemove}
              registerQuantityInput={registerQuantityInput}
              registerDeleteButton={registerDeleteButton}
            />
          )}

          {/* 로컬 전용 고지는 화면에서 한 번만 말한다(각주에서 반복하지 않는다).
              표 **아래**로 내렸다 — 제목과 표 사이를 비우는 편이 목록을 먼저 읽게 한다. */}
          <CardSubtitle>{copy.holdings.localOnly}</CardSubtitle>
        </HoldingsCard>

        {goalCard}
      </MainColumn>

      <RailColumn>
        <SummaryCard aria-labelledby={summaryTitleId} aria-busy={viewModel.isLoading || undefined}>
          <CardHeadPlain>
            <CardTitle id={summaryTitleId}>
              <CardTitleBadge aria-hidden>
                <CircleDollarSign size={ICON.md} strokeWidth={ICON.stroke} focusable={false} />
              </CardTitleBadge>
              {copy.summary.title}
            </CardTitle>
          </CardHeadPlain>

          <HeroSlot>
            <StatTile
              emphasis="hero"
              label={viewModel.heroTile.label}
              value={viewModel.isLoading ? <SkeletonBar /> : viewModel.heroTile.value}
              hint={viewModel.heroTile.hint}
            />
            {/* 선글라스 낀 하마 — "내 배당은 이렇게 들어오고 있다"(2026-08-05 사용자 지시).
                🔴 장식이라 alt 는 빈 문자열이다. 자리·겹침 규칙은 HeroMascot 주석에 있다.
                ⚠ 불러오는 중(골격)에는 그리지 않는다 — 값이 없는데 자랑하는 그림만 떠 있으면
                  "무엇을" 자랑하는지 모르는 화면이 된다. */}
            {viewModel.isLoading ? null : (
              <HeroMascot
                /* 🔴 카드 밖으로 나가는 것이 설계다(`right: calc(-1 * space[3])`). 이 선언이 없으면
                   overflowprobe 가 12px 누수로 잡는다 — 실패가 아니라 **의도**임을 도구에 말한다. */
                data-decorative-overflow="true"
                src="/images/hippo/hippo_sun_glasses.png"
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            )}
          </HeroSlot>

          {/* 🔴 종전 5칸 타일 격자를 정의 목록으로 내렸다 — 지표 다섯이 hero 와 같은 무게로
              서면 주인공이 사라진다. 라벨·값·힌트 문자열은 **그대로**다(모델 변경 없음). */}
          <FigureList>
            {viewModel.tiles.map((tile) => (
              <FigureRow key={tile.label}>
                <FigureTerm>{tile.label}</FigureTerm>
                <FigureValue>{viewModel.isLoading ? <SkeletonBar /> : tile.value}</FigureValue>
                {tile.hint ? <FigureHint>{tile.hint}</FigureHint> : null}
              </FigureRow>
            ))}
          </FigureList>

          {/*
            월간 리캡 — 이 앱이 "한 번 계산하면 끝"이 되지 않게 하는 자리(평가서 P1-⑤).
            🔴 불러오는 중에는 그리지 않는다. 값이 없는 띠는 "배당이 없다"로 읽힌다.
            ⚠ 지급월을 아는 종목이 없으면 부품이 스스로 null 을 낸다(같은 이유).
          */}
          {viewModel.isLoading || !viewModel.monthlyRecap ? null : (
            <MonthlyRecap model={viewModel.monthlyRecap} />
          )}

          {viewModel.showMonthlyVsThisMonthNote ? (
            <NoteLine>
              <Info size={16} strokeWidth={1.8} aria-hidden focusable={false} />
              {copy.summary.monthlyVsThisMonthNote}
            </NoteLine>
          ) : null}

          {viewModel.summaryNotes.map((note) => (
            <ExcludedNote key={note}>{note}</ExcludedNote>
          ))}

          {/* 🔴 요약 카드의 1급 행동은 **하나**다. 종전 두 번째 CTA(지급일 달력)는 아래 진입
              격자의 카드로 옮겼다 — 라벨·핸들러는 그대로이고 위계만 갈랐다.

              🔴 CTA 가 **도넛보다 위**에 있는 것은 의도다. 이 카드는 sticky 레일 안에서
              `max-height` + `overflow-y` 를 갖는다(뷰포트보다 높아도 아래쪽이 도달 불가가 되지
              않게). 그 경계 아래로 밀려나는 것은 **보조 정보여야지 1급 행동이면 안 된다** —
              도넛을 CTA 위에 두면 900px 높이 화면에서 버튼이 내부 스크롤 밖으로 나간다. */}
          <ActionRow>
            <Button
              type="button"
              variant="primary"
              disabled={viewModel.simulateCta.disabled}
              aria-describedby={viewModel.simulateCta.hint ? simulateHintId : undefined}
              onClick={onSimulate}
            >
              {copy.cta.simulate}
            </Button>
          </ActionRow>

          {/* 무음 비활성 금지 — 비활성이면 언제나 사유가 남는다(활성이어도 왜곡 가능성은 먼저 말한다). */}
          {viewModel.simulateCta.hint ? (
            <ActionHint id={simulateHintId}>{viewModel.simulateCta.hint}</ActionHint>
          ) : null}

          {/* 🔴 비중 도넛 — 조각 색이 보유 표의 종목 귀와 **같은 값**(assignSeries)이다.
              로딩 중에는 그리지 않는다(행이 비어 있어 0조각 도넛이 된다). 조각이 없으면
              컴포넌트가 스스로 null 을 낸다 — 빈 원판은 "0%"로 읽혀 거짓말이 된다. */}
          {showComposition ? (
            <>
              <CardDivider />
              <HoldingsComposition rows={viewModel.rows} title={copy.summary.composition.title} />
            </>
          ) : null}
        </SummaryCard>
      </RailColumn>
    </Workbench>
  );
}
