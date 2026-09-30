import { useId } from 'react';
import { Calculator } from 'lucide-react';
import { Button } from '@/components/common';
import { ICON } from '@/shared/styles';
import { ETF_MIX_COPY } from '../../../copy';
import { EmptyNote, SurfaceTitle } from '../../styled';
import type { OverlapSimulateProps } from './OverlapSimulate.types';
import { SimulateActions, SimulateLede, SimulateNote, SimulateSection } from './OverlapSimulate.styled';

const copy = ETF_MIX_COPY.simulate;

/**
 * "이 조합으로 배당 시뮬레이션" — 겹침을 확인한 **직후**가 실행 의도의 정점이다(비교 화면의 "이 종목으로 계산"과 같은 자리 논리).
 * 🔴 빠지는 ETF 가 있으면 버튼 **옆에서 먼저** 말한다 — 시뮬레이터에 가서야 알게 하면 조합이 조용히 바뀐 셈이다.
 * 🔴 "추천"이 아니다 — 이 조합이 좋은지는 이 화면이 말하지 않는다.
 */
export default function OverlapSimulate({ basketSize, canSimulate, excluded, onSimulate }: OverlapSimulateProps) {
  const baseId = useId();

  return (
    <SimulateSection aria-labelledby={`${baseId}-title`}>
      <SurfaceTitle id={`${baseId}-title`}>{copy.title}</SurfaceTitle>
      {basketSize === 0 ? (
        <EmptyNote>{copy.needOne}</EmptyNote>
      ) : (
        <>
          <SimulateLede>{copy.lede}</SimulateLede>
          {!canSimulate ? (
            <SimulateNote>{copy.noneKnown}</SimulateNote>
          ) : excluded.length > 0 ? (
            <SimulateNote id={`${baseId}-excluded`}>{copy.excluded(excluded.join(', '))}</SimulateNote>
          ) : null}
          <SimulateActions>
            <Button
              variant="primary"
              size="md"
              disabled={!canSimulate}
              aria-describedby={canSimulate && excluded.length > 0 ? `${baseId}-excluded` : undefined}
              startIcon={<Calculator size={ICON.sm} strokeWidth={ICON.stroke} aria-hidden focusable={false} />}
              onClick={onSimulate}
            >
              {copy.button}
            </Button>
          </SimulateActions>
        </>
      )}
    </SimulateSection>
  );
}
