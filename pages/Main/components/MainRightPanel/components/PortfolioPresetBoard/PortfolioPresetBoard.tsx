import { Card } from '@/components';
import { TOUR_TARGET } from '@/shared/constants';
import {
  PORTFOLIO_PRESET_PLACEHOLDERS,
  PRESET_ICON_BY_ID,
  PRESET_ICON_FALLBACK,
  PRESET_ICON_STROKE
} from './PortfolioPresetBoard.constants';
import {
  PortfolioPresetCardButton,
  PortfolioPresetContentRow,
  PortfolioPresetCore,
  PortfolioPresetDesc,
  PortfolioPresetGrid,
  PortfolioPresetIcon,
  PortfolioPresetMain,
  PortfolioPresetMeta,
  PortfolioPresetPlan,
  PortfolioPresetPlanItem,
  PortfolioPresetTitle,
  PortfolioPresetTitleRow,
  PRESET_ICON_TONES
} from './PortfolioPresetBoard.styled';
import type { PortfolioPresetBoardProps } from './PortfolioPresetBoard.types';

/**
 * 시뮬레이션 결과가 없을 때의 대체 카드 — 빈 포트폴리오면 추천 프리셋 온보딩 그리드,
 * 티커는 있는데 입력값이 유효하지 않으면 안내 문구를 보인다.
 * MainRightPanel 본체에서 뷰 조각만 분리했다 — 적용 확정·상태 반영은 부모가 담당한다.
 */
function PortfolioPresetBoard({ isPortfolioEmpty, onPresetSelect }: PortfolioPresetBoardProps) {
  return (
    <Card
      title={isPortfolioEmpty ? '추천 포트폴리오로 시작해보세요' : '결과'}
      subtitle={
        isPortfolioEmpty
          ? '하나를 고르면 설정이 자동으로 채워집니다. 언제든 왼쪽에서 바꿀 수 있어요.'
          : undefined
      }
    >
      {isPortfolioEmpty ? (
        <PortfolioPresetGrid data-tour={TOUR_TARGET.portfolioPresets} aria-label="포트폴리오 프리셋 목록">
          {PORTFOLIO_PRESET_PLACEHOLDERS.map((preset, presetIndex) => {
            const PresetIcon = PRESET_ICON_BY_ID[preset.id] ?? PRESET_ICON_FALLBACK;
            return (
            <PortfolioPresetCardButton key={preset.id} type="button" onClick={() => onPresetSelect(preset)}>
              <PortfolioPresetContentRow>
                <PortfolioPresetMain>
                  <PortfolioPresetTitleRow>
                    <PortfolioPresetIcon tone={PRESET_ICON_TONES[presetIndex % PRESET_ICON_TONES.length]}>
                      <PresetIcon size={18} strokeWidth={PRESET_ICON_STROKE} aria-hidden focusable={false} />
                    </PortfolioPresetIcon>
                    <PortfolioPresetTitle>{preset.title}</PortfolioPresetTitle>
                  </PortfolioPresetTitleRow>
                  <PortfolioPresetDesc>{preset.hook}</PortfolioPresetDesc>
                  <PortfolioPresetCore>핵심 구성: {preset.coreType}</PortfolioPresetCore>
                  <PortfolioPresetMeta>
                    성향: {preset.style} | 추천 대상: {preset.target}
                  </PortfolioPresetMeta>
                </PortfolioPresetMain>
                <PortfolioPresetPlan>
                  <PortfolioPresetPlanItem>
                    월 투자금 제안 <strong>{preset.monthlyInvestment}</strong>
                  </PortfolioPresetPlanItem>
                  <PortfolioPresetPlanItem>
                    목표 투자금 <strong>{preset.targetInvestment}</strong>
                  </PortfolioPresetPlanItem>
                  <PortfolioPresetPlanItem>
                    투자 기간 <strong>{preset.investmentPeriod}</strong>
                  </PortfolioPresetPlanItem>
                  <PortfolioPresetPlanItem>
                    목표 월배당(예상) <strong>{preset.expectedMonthlyDividend}</strong>
                  </PortfolioPresetPlanItem>
                </PortfolioPresetPlan>
              </PortfolioPresetContentRow>
            </PortfolioPresetCardButton>
            );
          })}
        </PortfolioPresetGrid>
      ) : (
        <p>입력값 오류를 수정하면 결과가 표시됩니다.</p>
      )}
    </Card>
  );
}

export default PortfolioPresetBoard;
