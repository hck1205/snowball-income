import { useEffect, useState } from 'react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { readPersistedAppState } from '@/jotai';
import type { PersistedScenarioState } from '@/jotai/snowball/types';
import { buildScenarioSimSummary } from '@/shared/lib/snowball';
import type { ScenarioSimSummary } from '@/shared/lib/snowball';
import {
  toScenarioPayload,
  validateScenarioPayload,
  type ScenarioPayload,
  type ScenarioPayloadIssue
} from '@/shared/lib/supabase';
const w = COMMUNITY_COPY.write;

/**
 * 첨부 컨텍스트 줄의 "티커 N개" — 저장되는 `summary.tickerCount`와 **같은 정의(included만)**.
 * 전체 `tickerProfiles.length`로 세면 저장 요약과 화면 표기가 어긋난다.
 * summary가 있으면 `summary.tickerCount`를 직접 쓰고, 계산 불가(summary null)일 때만 이 폴백을 쓴다.
 */
export const countIncludedTickers = (payload: ScenarioPayload | null | undefined): number => {
  const portfolio = payload?.portfolio;
  if (!portfolio) return 0;
  const included = new Set(portfolio.includedTickerIds ?? []);
  return (portfolio.tickerProfiles ?? []).filter((profile) => included.has(profile.id)).length;
};

/** 무효 payload의 사유 문구 — 컴포저(첨부 시 방어 검증)와 동일한 issue→카피 매핑을 공유한다. */
export const issueMessage = (issue: ScenarioPayloadIssue): string => {
  switch (issue) {
    case 'too-many-tickers':
      return w.issueTooManyTickers;
    case 'payload-too-large':
      return w.issuePayloadTooLarge;
    default:
      return w.issueMissingSettings;
  }
};

/**
 * 택1 카드 한 장 분량의 표시 모델(표시 전용 — 저장 아님).
 * `summary`/`tickerCount`는 `buildScenarioSimSummary`로 그때그때 계산한다(게시용 sim_summary는
 * 게시 시점 고정 — decisions.md 2026-07-17 arch).
 */
export type ScenarioCandidate = {
  id: string;
  name: string;
  payload: ScenarioPayload;
  /** validateScenarioPayload 통과 = 라디오 선택 가능. */
  selectable: boolean;
  /** !selectable일 때 비활성 사유(issueMessage). */
  disabledReason?: string;
  /** 표시 전용 시뮬 요약. 계산 불가(미완성 등)면 null → 컨텍스트 줄만 표시. */
  summary: ScenarioSimSummary | null;
  tickerCount: number;
  initial: number;
  monthly: number;
};

export type ScenarioCandidates =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'ready'; candidates: ScenarioCandidate[] };

const toCandidate = (scenario: PersistedScenarioState): ScenarioCandidate => {
  const payload = toScenarioPayload(scenario);
  const issues = validateScenarioPayload(payload);
  const selectable = issues.length === 0;
  const summary = selectable ? buildScenarioSimSummary(payload) : null;

  return {
    id: scenario.id,
    name: scenario.name,
    payload,
    selectable,
    disabledReason: selectable ? undefined : issueMessage(issues[0]),
    summary,
    tickerCount: summary?.tickerCount ?? countIncludedTickers(payload),
    initial: payload.investmentSettings.initialInvestment,
    monthly: payload.investmentSettings.monthlyContribution
  };
};

/**
 * 첨부 **택1 목록** 표시 훅 — mount 1회 로컬 영속 상태를 읽어 워크스페이스 시나리오 탭 전부를
 * 카드 후보로 매핑한다(활성 1개만 보던 단일 프리뷰를 목록으로 확장).
 *
 * read-only 표시 전용 — 실제 첨부는 뷰가 고른 candidate.payload를 `composer.attachScenario`로 커밋한다.
 * 무효 payload 시나리오는 목록에서 빼지 않고 비활성 카드로 남긴다(멘탈모델 유지). 단, 선택 가능한
 * 후보가 하나도 없으면(전부 무효 또는 0개) empty로 접어 무행동 목록을 숨긴다.
 */
export const useScenarioCandidates = (): ScenarioCandidates => {
  const [state, setState] = useState<ScenarioCandidates>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = await readPersistedAppState();
      if (cancelled) return;

      const { scenarios } = result.payload;
      if (scenarios.length === 0) {
        setState({ status: 'empty' });
        return;
      }

      const candidates = scenarios.map((scenario) => toCandidate(scenario));
      const selectable = candidates.filter((candidate) => candidate.selectable);
      if (selectable.length === 0) {
        setState({ status: 'empty' });
        return;
      }

      setState({ status: 'ready', candidates });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};
