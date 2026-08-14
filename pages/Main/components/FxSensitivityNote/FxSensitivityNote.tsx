import { memo } from 'react';

import { SIMULATOR_COPY } from '@/shared/constants';
import { buildFxSensitivityModel } from '@/shared/lib/snowball';

import * as S from './FxSensitivityNote.styled';
import type { FxSensitivityNoteProps } from './FxSensitivityNote.types';

const COPY = SIMULATOR_COPY.fxSensitivity;

/**
 * **환율이 이 계산에 들어 있지 않다는 사실**과 그래서 결과가 얼마나 흔들리는지를 밝힌다.
 *
 * ## 왜 입력칸이 아니라 안내인가
 * 엔진은 가격 단위에 **척도 불변**이라 환율 하나를 곱해도 결과가 그대로다(`SnowballFxSensitivity` 참고).
 * 결과를 실제로 바꾸려면 매수·평가 두 환율이 필요한데, 그건 사용자에게 **20년 뒤 환율을 찍으라**는
 * 요구다. 환율은 이 모델의 어떤 변수보다 예측 불가능하고, 찍은 숫자가 결과에 굵게 실리면 이 사이트가
 * 지키려는 톤("트레이드오프를 먼저 말한다")이 무너진다. 그래서 **상수 배율이라는 성질을 숨기지 않고
 * 드러내서** 같은 정보를 전달한다.
 *
 * 🔴 국내 상장 종목만 담은 포트폴리오에는 **아무것도 그리지 않는다.** 원화로 사서 원화로 배당받는
 * 사람에게 환율 경고는 사실이 아니고, 맞지 않는 경고는 다른 경고의 신뢰까지 깎는다.
 */
function FxSensitivityNote({ tickers, fxRate }: FxSensitivityNoteProps) {
  const model = buildFxSensitivityModel({ tickers, fxRate });

  if (!model.visible) return null;

  return (
    <S.Wrapper aria-label={COPY.title}>
      <S.Title>{COPY.title}</S.Title>
      <S.Body>
        {COPY.body(model.swingPercent)} {COPY.closing}
      </S.Body>
      {/* 환율 조회가 실패해도 위 문장은 그대로 참이라 안내를 접지 않는다 — 실값만 빠진다. */}
      {model.fxRate !== null && <S.Rate>{COPY.rate(model.fxRate)}</S.Rate>}
    </S.Wrapper>
  );
}

export default memo(FxSensitivityNote);
