import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link2, RotateCcw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TickerPageShell } from '@/pages/Ticker/components';
import { INVESTOR_AXES, INVESTOR_QUESTIONS } from '@/shared/constants/investorType';
import { PORTFOLIO_PRESET_PLACEHOLDERS } from '@/shared/constants/portfolioPresets';
import { PRESET_QUERY_PARAM } from '@/pages/Main/components/MainRightPanel/hooks';
import { INVESTOR_TYPE_PATH, SIMULATOR_PATH } from '@/shared/constants/routes';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { storageKey } from '@/shared/lib/storage';
import {
  decodeInvestorResult,
  encodeInvestorResult,
  resolveInvestorTypeFromAnswers,
  type InvestorAnswers
} from '@/shared/lib/investorType';
import {
  AllocationBar,
  AllocationItem,
  AllocationLegend,
  AllocationSegment,
  AllocationTicker,
  AxisBadge,
  AxisCaption,
  AxisDot,
  AxisHead,
  AxisLabels,
  AxisName,
  AxisRow,
  AxisTrack,
  Disclaimer,
  GhostButton,
  KeyHint,
  MatchAvatar,
  MatchBody,
  MatchItem,
  MatchList,
  MatchName,
  MatchWhy,
  NavRow,
  NextGrid,
  NextLink,
  OptionButton,
  OptionList,
  OptionOrder,
  Panel,
  PanelTitle,
  Progress,
  ProgressFill,
  ProgressText,
  ProgressTrack,
  QuestionCard,
  QuestionContext,
  QuestionTitle,
  ResultBody,
  ResultEyebrow,
  ResultHead,
  ResultTagline,
  ResultTitle,
  ShareButton,
  ShareGhost,
  ShareNotice,
  ShareRow,
  Stack
} from './InvestorTypePage.styled';

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

/** 진행 중 답안. 🔴 접두사는 `storageKey` 가 소유한다 — 문자열을 직접 적지 마라. */
const ANSWERS_KEY = storageKey('investor-type:answers:v1');

const readSavedAnswers = (): InvestorAnswers => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(ANSWERS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    // 손상된 저장값은 조용히 빈 답안으로 — throw 하지 않는다(하위 호환 규율).
    return parsed && typeof parsed === 'object' ? (parsed as InvestorAnswers) : {};
  } catch {
    return {};
  }
};

const writeSavedAnswers = (answers: InvestorAnswers): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
  } catch {
    // 쿼터·차단 → 이어하기만 못 한다. 테스트 자체는 계속 된다.
  }
};

/**
 * 이름의 **낱말 첫 글자들**. "워런 버핏" → "워버". 한글은 성 한 글자만 떼면 구별이 안 된다
 * (`pages/Investors/utils` 가 같은 규칙을 쓴다 — 두 화면의 이니셜이 갈리면 같은 사람으로 안 읽힌다).
 */
const toInitials = (person: string): string =>
  person
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 3);

const clearSavedAnswers = (): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(ANSWERS_KEY);
  } catch {
    // no-op
  }
};

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
    const { profile, scores } = result;
    const preset = PORTFOLIO_PRESET_PLACEHOLDERS.find((candidate) => candidate.id === profile.presetId);

    return (
      <TickerPageShell>
        <Stack>
          <ResultHead>
            <ResultEyebrow>답해 주신 12문항으로 본 성향</ResultEyebrow>
            <ResultTitle>{profile.name}</ResultTitle>
            <ResultTagline>{profile.tagline}</ResultTagline>
          </ResultHead>

          <ResultBody>{profile.description}</ResultBody>

          <Panel>
            <PanelTitle>네 축에서 어디쯤인가</PanelTitle>
            {INVESTOR_AXES.map((axis) => (
              <AxisRow key={axis.id}>
                {/* 🔴 축 이름이 없으면 사용자는 막대 넷을 보면서 그것들이 무슨 관계인지 알 수 없다. */}
                <AxisHead>
                  <AxisName>{axis.label}</AxisName>
                  <AxisCaption>{axis.caption}</AxisCaption>
                </AxisHead>
                <AxisTrack
                  role="img"
                  aria-label={`${axis.label}: ${axis.low} 0, ${axis.high} 100 중 ${scores[axis.id]}`}
                >
                  <AxisDot $percent={scores[axis.id]} />
                </AxisTrack>
                <AxisLabels>
                  <span>{axis.low}</span>
                  <span>{axis.high}</span>
                </AxisLabels>
              </AxisRow>
            ))}
          </Panel>

          {/* 🔴 빈 배열이 정상 상태다 — 13F 로 뒷받침되지 않는 유형은 대가를 대지 않는다. */}
          {profile.investors.length > 0 ? (
            <Panel>
              <PanelTitle>공시에서 비슷한 모습을 보이는 투자자</PanelTitle>
              <MatchList>
                {profile.investors.map((match) => (
                  <MatchItem key={match.cik}>
                    <MatchAvatar aria-hidden>{toInitials(match.person)}</MatchAvatar>
                    <MatchBody>
                      <MatchName>{match.person}</MatchName>
                      <MatchWhy>{match.why}</MatchWhy>
                    </MatchBody>
                  </MatchItem>
                ))}
              </MatchList>
              <Disclaimer>
                분기마다 공시되는 13F 보유 내역을 견준 것이며, 실시간 정보도 따라 하기를 권하는 것도 아닙니다.
              </Disclaimer>
            </Panel>
          ) : null}

          {preset ? (
            <Panel>
              <PanelTitle>성향과 결이 비슷한 구성 예시</PanelTitle>
              <MatchName>{preset.title}</MatchName>
              <MatchWhy>{preset.hook}</MatchWhy>

              {/* 🔴 숫자만 나열하면 무엇이 주인공인지 눈으로 더해야 안다. 막대가 그걸 한눈에 준다.
                  색은 hue 한 계열의 농도 차이로만 가른다 — 여섯 색을 주면 결과의 주인공(유형)보다
                  이 패널이 시끄러워진다. */}
              <AllocationBar
                role="img"
                aria-label={`구성 비중: ${preset.allocations
                  .map((slice) => `${slice.ticker} ${slice.weight}%`)
                  .join(', ')}`}
              >
                {preset.allocations.map((slice, index) => (
                  <AllocationSegment
                    key={slice.ticker}
                    $weight={slice.weight}
                    /* 앞쪽(비중이 큰 쪽)이 진하다. 22 → 8 사이를 균등하게 나눈다. */
                    $depth={Math.max(8, 22 - index * 3)}
                  />
                ))}
              </AllocationBar>
              <AllocationLegend>
                {preset.allocations.map((slice) => (
                  <AllocationItem key={slice.ticker}>
                    <AllocationTicker>{slice.ticker}</AllocationTicker>
                    <span>{slice.weight}%</span>
                  </AllocationItem>
                ))}
              </AllocationLegend>
              {/* 🔴 이 흐름의 **착지점**이다. 여기서 끊기면 사용자는 계산기로 건너가 종목을 손으로
                  다시 찾아 넣어야 하고, 테스트는 "재미로 해 봤다"로 끝난다.
                  ⚠ 쿼리는 시뮬레이터의 `usePresetQueryApply` 가 읽어 **확인 모달**을 띄운다 —
                    이미 포트폴리오가 있는 사용자를 링크 하나로 덮지 않기 위해서다. */}
              <NextLink
                to={`${SIMULATOR_PATH}?${PRESET_QUERY_PARAM}=${preset.id}`}
                onClick={() =>
                  trackEvent(ANALYTICS_EVENT.QUIZ_RESULT_ACTION, { action: 'prefill', type_id: profile.id })
                }
              >
                이 구성으로 계산해 보기 →
              </NextLink>
            </Panel>
          ) : null}

          <Panel>
            <PanelTitle>이어서 볼 곳</PanelTitle>
            <NextGrid>
              {profile.next.map((link) => (
                <li key={link.to}>
                  <NextLink
                    to={link.to}
                    onClick={() =>
                      trackEvent(ANALYTICS_EVENT.QUIZ_RESULT_ACTION, { action: 'next', type_id: profile.id })
                    }
                  >
                    {link.label}
                  </NextLink>
                </li>
              ))}
            </NextGrid>
          </Panel>

          <ShareRow>
            <ShareButton type="button" onClick={() => void handleShare(profile.id)}>
              <Link2 size={16} strokeWidth={1.8} aria-hidden focusable={false} />
              링크 복사
            </ShareButton>

            {/* 같은 줄, 한 단 낮은 무게. 결과에서 할 일은 공유·이어보기지 다시 푸는 게 아니다. */}
            <ShareGhost type="button" onClick={handleRestart}>
              <RotateCcw size={14} strokeWidth={1.8} aria-hidden focusable={false} />
              다시 해보기
            </ShareGhost>

            {/* 이 주소가 곧 결과다 — 압축하지 않아 받는 사람도 무엇인지 읽을 수 있다. */}
            <ShareNotice role="status">{shareNotice}</ShareNotice>
          </ShareRow>

          <Disclaimer>
            입력하신 답을 그대로 분류해 보여 주는 참고 자료이며 투자 자문이 아닙니다. 실제 판단은 본인의 상황과
            책임으로 하셔야 합니다.
          </Disclaimer>
        </Stack>
      </TickerPageShell>
    );
  }

  /* ── 문항 화면 ────────────────────────────────────────────────────── */
  const question = INVESTOR_QUESTIONS[currentIndex === -1 ? 0 : currentIndex];
  const humanIndex = (currentIndex === -1 ? 0 : currentIndex) + 1;
  const axis = INVESTOR_AXES.find((candidate) => candidate.id === question.axis);
  const percent = Math.round(((humanIndex - 1) / INVESTOR_QUESTIONS.length) * 100);

  return (
    <TickerPageShell>
      <Stack>
        <Progress>
          {/* 🔴 숫자와 막대를 함께 준다 — 막대만으로는 "몇 개 남았나"에 답하지 못한다. */}
          <ProgressText>
            {humanIndex} / {INVESTOR_QUESTIONS.length}
            {humanIndex > 1 ? ` · ${INVESTOR_QUESTIONS.length - humanIndex + 1}문항 남았습니다` : null}
          </ProgressText>
          <ProgressTrack>
            <ProgressFill $percent={percent} />
          </ProgressTrack>
        </Progress>

        <QuestionCard>
          {/* 🔴 지금 무엇을 재는 중인지 밝힌다. 없으면 12문항이 서로 무관한 질문 더미로 읽힌다. */}
          <AxisBadge>{axis?.label}</AxisBadge>
          {question.context ? <QuestionContext>{question.context}</QuestionContext> : null}
          <QuestionTitle>{question.question}</QuestionTitle>

          <OptionList>
            {question.options.map((option, index) => (
              <li key={option.label}>
                <OptionButton
                  type="button"
                  onClick={() => handleAnswer(question.id, index, question.axis, humanIndex)}
                >
                  {/* 번호는 키보드 힌트를 겸한다. aria-hidden 이라 낭독기에는 문장만 들린다. */}
                  <OptionOrder aria-hidden>{index + 1}</OptionOrder>
                  <span>{option.label}</span>
                </OptionButton>
              </li>
            ))}
          </OptionList>

          <KeyHint>키보드 1~4 로도 고르실 수 있습니다.</KeyHint>
        </QuestionCard>

        {humanIndex > 1 ? (
          <NavRow>
            <GhostButton type="button" onClick={handleBack}>
              ← 이전 문항
            </GhostButton>
          </NavRow>
        ) : null}

        <Disclaimer>
          정답이 없는 문항입니다. 지금 실제로 어떻게 하시는지에 가까운 쪽을 고르시면 됩니다.
        </Disclaimer>
      </Stack>
    </TickerPageShell>
  );
}
