import { GUIDE_START_PATH, guidePath } from '@/shared/constants/guides';
import { SIMULATOR_PATH } from '@/shared/constants/routes';
import { LANDING_COPY } from '../../copy';
import {
  FinalStepLink,
  PathList,
  PathStep,
  StepAction,
  StepBody,
  StepLede,
  StepLink,
  StepTitle
} from './StartPath.styled';

const copy = LANDING_COPY.startPath;

/**
 * **처음 온 사람이 밟는 순서** — 계좌 여는 법 → 배당이란 → 지수추종과의 차이 → 계산법 → 목표 세우기.
 *
 * ## 왜 필요했나
 * 이 랜딩은 "배당을 안다"를 전제로 서 있었다(2026-08-06 사용자 지적: 투자를 어떻게 시작하는지,
 * 계좌는 어떻게 여는지, 지수추종이 뭔지, 배당이 뭔지를 알려 주지 못한다). 개념을 모르는 사람이
 * 계산기 앞에 서면 아무것도 못 하고 나간다 — 이 블록이 그 앞단을 채운다.
 *
 * ## 구조
 * 🔴 걸음의 목록은 `GUIDE_START_PATH` **하나**가 소유한다. 여기서 제목·설명을 다시 적지 않는다 —
 * 가이드의 제목이 바뀌면 랜딩도 따라 바뀌어야 하고, 두 곳에 적으면 반드시 갈린다.
 * 🔴 **마지막 걸음만 계산기로 간다.** 앞의 넷은 읽는 곳이고 마지막이 하는 곳이라, 그 하나만 무게를
 *   올린다(FinalStepLink). 다섯을 다 강조하면 순서가 사라진다.
 * ⚠ 가이드가 늘어도 이 경로는 다섯 걸음이다 — 그 편집은 `GUIDE_START_PATH` 가 맡는다.
 */
export default function StartPath() {
  return (
    <PathList>
      {GUIDE_START_PATH.map((guide) => (
        <PathStep key={guide.slug}>
          <StepLink to={guidePath(guide.slug)}>
            <StepBody>
              <StepTitle>{guide.title}</StepTitle>
              <StepLede>{guide.lede}</StepLede>
            </StepBody>
            <StepAction>{copy.readAction}</StepAction>
          </StepLink>
        </PathStep>
      ))}

      {/* 🔴 이 경로가 향하는 곳. 앞의 걸음들과 같은 줄 모양이되 무게만 한 단 높다. */}
      <PathStep>
        <FinalStepLink to={SIMULATOR_PATH}>
          <StepBody>
            <StepTitle>{copy.finalTitle}</StepTitle>
            <StepLede>{copy.finalLede}</StepLede>
          </StepBody>
          <StepAction>{copy.finalAction}</StepAction>
        </FinalStepLink>
      </PathStep>
    </PathList>
  );
}
