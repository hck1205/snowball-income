import { useCallback, useMemo } from 'react';
import {
  useIncludedProfilesAtomValue,
  useReinvestPercentByTickerIdAtomValue,
  useReinvestTargetByTickerIdAtomValue,
  useSetReinvestPercentByTickerIdWrite,
  useSetReinvestTargetByTickerIdWrite
} from '@/jotai';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import type { InvestmentSettingsReinvestRouting } from '@/components/InvestmentSettings';

/**
 * 기본값과 같아진 키는 **지운다**.
 *
 * 🔴 남겨 두면 전역 기본 비율을 고쳐도 그 종목만 옛 기본값으로 굳는다 — "전역을 바꿨는데
 *    아무것도 안 바뀐다"가 된다. 목적지도 자기 자신이면 지운다: 그게 기본값이라 들고 있어 봐야
 *    공유 링크만 길어지고(인코더가 자기 자신을 싣지 않는다) 비교도 흔들린다.
 */
const dropWhenDefault = <TValue,>(
  map: Record<string, TValue>,
  id: string,
  value: TValue,
  fallback: TValue
): Record<string, TValue> => {
  const next = { ...map };
  if (value === fallback) delete next[id];
  else next[id] = value;
  return next;
};

/**
 * 종목별 배당 재투자(비율·목적지)를 화면에 내려보낼 묶음으로 만든다.
 *
 * 값은 atom 이 들고 화면(`ReinvestRouting`)은 표만 그린다 — 이 훅이 그 사이의 유일한 통로다.
 * `MainLeftPanel` 본문에서 떼어낸 이유는 관심사다: 저쪽은 좌측 패널의 조립이고, 이건 재투자
 * 상태의 읽기·쓰기 규칙이다(형제인 `MainRightPanel` 도 같은 방식으로 `hooks/` 를 갖는다).
 */
export const useReinvestRouting = (globalPercent: number): InvestmentSettingsReinvestRouting => {
  const includedProfiles = useIncludedProfilesAtomValue();
  const percentByTickerId = useReinvestPercentByTickerIdAtomValue();
  const targetByTickerId = useReinvestTargetByTickerIdAtomValue();
  const setPercentByTickerId = useSetReinvestPercentByTickerIdWrite();
  const setTargetByTickerId = useSetReinvestTargetByTickerIdWrite();

  const onSetPercent = useCallback(
    (profileId: string, percent: number) => {
      trackEvent(ANALYTICS_EVENT.INVESTMENT_SETTING_CHANGED, {
        field_name: 'reinvestPercentByTicker',
        value: percent
      });
      setPercentByTickerId((prev) => dropWhenDefault(prev, profileId, percent, globalPercent));
    },
    [globalPercent, setPercentByTickerId]
  );

  const onSetTarget = useCallback(
    (profileId: string, targetId: string) => {
      /* 🔴 계측 값공간에 **티커 id 를 싣지 않는다** — 카디널리티가 종목 수만큼 늘고 사용자 데이터다.
         알고 싶은 것은 "자기 자신인가 아닌가"뿐이다. */
      trackEvent(ANALYTICS_EVENT.INVESTMENT_SETTING_CHANGED, {
        field_name: 'reinvestTargetByTicker',
        value: profileId === targetId ? 'self' : 'other'
      });
      setTargetByTickerId((prev) => dropWhenDefault(prev, profileId, targetId, profileId));
    },
    [setTargetByTickerId]
  );

  return useMemo(
    () => ({ includedProfiles, percentByTickerId, targetByTickerId, onSetPercent, onSetTarget }),
    [includedProfiles, onSetPercent, onSetTarget, percentByTickerId, targetByTickerId]
  );
};
