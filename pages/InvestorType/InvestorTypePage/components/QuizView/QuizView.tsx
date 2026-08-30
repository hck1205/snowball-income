import { ArrowLeft, ChevronRight } from 'lucide-react';
import { INVESTOR_AXES, INVESTOR_QUESTIONS } from '@/shared/constants/investorType';
import { ICON } from '@/shared/styles';
import type { QuizViewProps } from '../../InvestorTypePage.types';
import {
  Disclaimer,
  Stack
} from '../../InvestorTypePage.styled';
import {
  AxisBadge,
  GhostButton,
  KeyHint,
  NavRow,
  OptionButton,
  OptionChevron,
  OptionList,
  OptionOrder,
  OptionText,
  Progress,
  ProgressCount,
  ProgressFill,
  ProgressRemain,
  ProgressText,
  ProgressTrack,
  QuestionCard,
  QuestionContext,
  QuestionTitle,
  QuizEyebrow
} from './QuizView.styled';

/**
 * 투자 성향 테스트 — **문항 화면**(순수 뷰).
 *
 * ## 왜 갈라져 있나 (2026-08-27)
 * 한 파일이 435줄로 상태·계측·라우팅·문항·결과를 전부 들고 있었다. 두 화면은 같은 라우트를 쓰지만
 * **함께 보이는 일이 없다** — 그 이음매가 가장 자연스러운 절단면이다. 컨테이너는 상태만 갖고
 * 여기는 그리기만 한다(`pages/Main` 의 `Main.tsx` ↔ `Main.view.tsx` 와 같은 규약).
 *
 * ## 화면의 수직 순서
 * ① 이 화면이 무엇인지(작게) → ② 어디까지 왔는지 → ③ 지금 무엇을 재는지 → ④ 문항 → ⑤ 선택지.
 * 🔴 ①을 지우지 마라. 그전에는 화면이 `1 / 12` 로 **갑자기 시작**해서, 링크를 받고 들어온 사람이
 *   무엇을 하는 곳인지 알 수 없었다(2026-08-27 사용자 지적: "UI가 너무 허접").
 *
 * ⚠ 진입 애니메이션 금지(랜딩과 같은 규율). 호버·누름만 기존 토큰 안에서 쓴다.
 */
export default function QuizView({ humanIndex, onAnswer, onBack }: QuizViewProps) {
  const question = INVESTOR_QUESTIONS[humanIndex - 1];
  const axis = INVESTOR_AXES.find((candidate) => candidate.id === question.axis);
  const total = INVESTOR_QUESTIONS.length;
  /*
   * 🔴 **답한 개수가 아니라 지금 위치**로 채운다. 답한 개수(humanIndex - 1)로 두면 첫 문항에서
   * 막대가 0% 라 빈 줄로 보이고(2026-08-27 실측), 시작하자마자 "아직 아무것도 안 했다"는 인상을
   * 준다. 마지막 문항이 100% 인 것도 맞다 — 그 답을 고르는 순간 결과로 넘어가므로 100% 인 채로
   * 머무는 상태가 없다.
   */
  const percent = Math.round((humanIndex / total) * 100);
  const remaining = total - humanIndex + 1;

  return (
    <Stack>
      {/* ① 링크를 받고 들어온 사람에게 여기가 어디인지 말한다. */}
      <QuizEyebrow>투자 성향 테스트</QuizEyebrow>

      <Progress>
        {/* 🔴 숫자와 막대를 함께 준다 — 막대만으로는 "몇 개 남았나"에 답하지 못한다.
            현재 번호만 크게 두어 훑는 눈이 거기서 멈춘다. */}
        <ProgressText>
          {/* ⚠ **한 텍스트 노드로 둔다.** 번호와 총계를 두 요소로 쪼개면 화면은 같아 보여도
              "1 / 12" 를 한 덩어리로 찾는 쪽(테스트·낭독기)이 못 찾는다(2026-08-27 실측). */}
          <ProgressCount>
            {humanIndex} / {total}
          </ProgressCount>
          {humanIndex > 1 ? <ProgressRemain>{remaining}문항 남았습니다</ProgressRemain> : null}
        </ProgressText>
        {/* 🔴 막대에 시맨틱을 준다. 그전에는 의미 없는 div 두 겹이라 낭독기에 진행이 전혀 전달되지
            않았다 — 12문항짜리 흐름에서 그것은 "언제 끝나는지 모른 채 답하기"다. */}
        <ProgressTrack
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={humanIndex}
          aria-valuetext={`${total}문항 중 ${humanIndex}번째`}
        >
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
                onClick={() => onAnswer(question.id, index, question.axis, humanIndex)}
              >
                {/* 번호는 키보드 힌트를 겸한다. aria-hidden 이라 낭독기에는 문장만 들린다. */}
                <OptionOrder aria-hidden data-option-order>{index + 1}</OptionOrder>
                <OptionText>{option.label}</OptionText>
                {/* 누를 수 있는 것임을 형태로 말한다. 호버에서만 진해진다(styled). */}
                <OptionChevron aria-hidden data-option-chevron>
                  <ChevronRight size={ICON.md} strokeWidth={2} focusable={false} />
                </OptionChevron>
              </OptionButton>
            </li>
          ))}
        </OptionList>

        <KeyHint>키보드 1~4 로도 고르실 수 있습니다.</KeyHint>
      </QuestionCard>

      {humanIndex > 1 ? (
        <NavRow>
          <GhostButton type="button" onClick={onBack}>
            <ArrowLeft size={ICON.sm} strokeWidth={1.8} aria-hidden focusable={false} />
            이전 문항
          </GhostButton>
        </NavRow>
      ) : null}

      <Disclaimer>
        정답이 없는 문항입니다. 지금 실제로 어떻게 하시는지에 가까운 쪽을 고르시면 됩니다.
      </Disclaimer>
    </Stack>
  );
}
