import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TickerPageShell } from '@/pages/Ticker/components';
import { INVESTOR_QUESTIONS } from '@/shared/constants/investorType';
import { INVESTOR_TYPE_PATH } from '@/shared/constants/routes';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { QuizView, ResultView } from './components';
import { clearSavedAnswers, readSavedAnswers, writeSavedAnswers } from './InvestorTypePage.utils';
import {
  decodeInvestorResult,
  encodeInvestorResult,
  resolveInvestorTypeFromAnswers,
  type InvestorAnswers
} from '@/shared/lib/investorType';

/**
 * 투자 성향 테스트 — **문항과 결과가 한 라우트**를 쓴다.
 *
 * ## 왜 결과가 별도 라우트가 아닌가
 * 결과를 `/investor-type/result` 로 두면 "답안이 없는 결과 주소"라는 상태가 생기고, 새로고침·
 * 뒤로 가기·공유마다 그때 무엇을 보여 줄지가 문제가 된다. 쿼리(`?t=…&s=…`)면 **링크 자체가 결과를
 * 싣고 있어** 그 상태가 애초에 없다 — 파라미터가 없으면 문항, 있으면 결과다.
 *
 * ## 🔴 모달이 아니다
 * 12문항짜리 흐름을 모달로 만들면 중간에 새로고침한 사용자가 답안을 통째로 잃는다. 정식 라우트라
 * 뒤로 가기가 살아 있고, 진행 중 답안은 localStorage 에 남아 다시 들어와도 이어진다.
 *
 * ## 계측
 * `quiz_answered` 를 **문항마다** 쏜다. 12문항은 정밀도를 위해 고른 값이라(사용자 결정), 실제 이탈이
 * 어디서 나는지 모르면 줄일 근거도 늘릴 근거도 생기지 않는다.
 */

export default function InvestorTypePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const result = useMemo(() => decodeInvestorResult(searchParams), [searchParams]);

  /** 답안은 렌더 **전에** 나와야 첫 프레임이 올바른 문항에서 시작한다(이펙트로 읽으면 한 번 튄다). */
  const [answers, setAnswers] = useState<InvestorAnswers>(() => readSavedAnswers());

  /** 다음에 답할 문항 = 아직 답이 없는 **첫** 문항. 중간에 뒤로 갔다 와도 자리를 잃지 않는다. */
  const currentIndex = useMemo(
    () => INVESTOR_QUESTIONS.findIndex((question) => !Number.isInteger(answers[question.id])),
    [answers]
  );

  const handleAnswer = useCallback(
    (questionId: string, optionIndex: number, axis: string, humanIndex: number) => {
      const next = { ...answers, [questionId]: optionIndex };
      setAnswers(next);
      writeSavedAnswers(next);
      trackEvent(ANALYTICS_EVENT.QUIZ_ANSWERED, { question_index: humanIndex, axis });

      // 마지막 문항이면 곧장 결과로. 결과는 쿼리에 실리므로 이 이동이 곧 공유 가능한 링크가 된다.
      const remaining = INVESTOR_QUESTIONS.filter((question) => !Number.isInteger(next[question.id]));
      if (remaining.length > 0) return;

      const { scores, profile } = resolveInvestorTypeFromAnswers(next);
      trackEvent(ANALYTICS_EVENT.QUIZ_COMPLETED, { type_id: profile.id });
      clearSavedAnswers();
      navigate(`${INVESTOR_TYPE_PATH}?${encodeInvestorResult(profile, scores)}`, { replace: true });
    },
    [answers, navigate]
  );

  const handleBack = useCallback(() => {
    // 직전 문항의 답만 지운다 — 그러면 `currentIndex` 가 저절로 한 칸 뒤로 간다.
    const previous = INVESTOR_QUESTIONS[Math.max(0, currentIndex - 1)];
    if (!previous) return;
    const next = { ...answers };
    delete (next as Record<string, number>)[previous.id];
    setAnswers(next);
    writeSavedAnswers(next);
  }, [answers, currentIndex]);

  /** 복사 안내. 🔴 무음 성공 금지 — 눌렀는데 아무 일도 없어 보이면 사용자는 다시 누른다. */
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const handleShare = useCallback(async (typeId: string) => {
    trackEvent(ANALYTICS_EVENT.QUIZ_RESULT_ACTION, { action: 'share', type_id: typeId });

    const url = typeof window === 'undefined' ? '' : window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareNotice('링크를 복사했습니다.');
    } catch {
      // 클립보드 권한이 없거나 http 환경이면 실패한다. 주소창 복사라는 길이 남아 있으므로 그렇게 안내한다.
      setShareNotice('복사할 수 없었습니다. 주소창의 주소를 복사해 주세요.');
    }
  }, []);

  const handleRestart = useCallback(() => {
    clearSavedAnswers();
    setAnswers({});
    navigate(INVESTOR_TYPE_PATH, { replace: true });
  }, [navigate]);

  /**
   * 숫자키 1~4 로 고른다.
   *
   * 12문항을 마우스로만 넘기면 손이 화면을 12번 왕복한다. 키보드 한 번이면 끝나는 일이라 붙였다.
   * 🔴 훅이므로 결과 화면 조기 return **앞**에 있어야 한다 — 뒤로 옮기면 렌더마다 훅 개수가 달라져
   *   React 가 죽는다.
   * ⚠ 결과 화면(`result`)에서는 아무것도 하지 않는다. 입력 중(input/textarea)일 때도 비켜선다 —
   *   지금 이 화면엔 입력칸이 없지만, 나중에 생겼을 때 조용히 충돌하는 종류의 버그다.
   */
  useEffect(() => {
    if (result) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      const picked = Number(event.key);
      if (!Number.isInteger(picked) || picked < 1 || picked > 4) return;

      const pending = INVESTOR_QUESTIONS.find((candidate) => !Number.isInteger(answers[candidate.id]));
      if (!pending) return;

      event.preventDefault();
      const order = INVESTOR_QUESTIONS.indexOf(pending) + 1;
      handleAnswer(pending.id, picked - 1, pending.axis, order);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [answers, handleAnswer, result]);

  /* ── 결과 화면 ────────────────────────────────────────────────────── */
  if (result) {
    return (
      <TickerPageShell>
        <ResultView
          profile={result.profile}
          scores={result.scores}
          shareNotice={shareNotice}
          onShare={() => void handleShare(result.profile.id)}
          onRestart={handleRestart}
          onNext={(action) =>
            trackEvent(ANALYTICS_EVENT.QUIZ_RESULT_ACTION, { action, type_id: result.profile.id })
          }
        />
      </TickerPageShell>
    );
  }

  /* ── 문항 화면 ────────────────────────────────────────────────────── */
  return (
    <TickerPageShell>
      <QuizView
        humanIndex={(currentIndex === -1 ? 0 : currentIndex) + 1}
        onAnswer={handleAnswer}
        onBack={handleBack}
      />
    </TickerPageShell>
  );
}
