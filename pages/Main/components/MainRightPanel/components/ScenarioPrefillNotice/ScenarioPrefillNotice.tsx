import { Banner } from '@/components/common';
import { useScenarioPrefillAtomValue } from '@/jotai';
import { PORTFOLIO_PRESET_PLACEHOLDERS } from '../PortfolioPresetBoard';

/**
 * 프리필로 열린 화면의 출처 안내.
 *
 * 첫 화면이 이미 계산된 채로 열리므로, **그 숫자가 어디서 왔는지**를 결과보다 먼저 말해야 한다.
 * 말하지 않으면 사용자는 자기가 만든 적 없는 포트폴리오를 자기 것으로 오해한다.
 *
 * ⚠ 2026-08-23 부터 이 배너가 뜨는 경우는 **하나뿐**이다 — 성향 테스트 결과(`?preset=`)로 들어온 방문.
 *   그냥 들어온 첫 방문은 프리필하지 않고 택일 화면을 띄우므로 여기 올 일이 없다.
 *   그래서 "추천 구성"이라는 말을 뺐다. 사용자가 자기 답으로 고른 결과인데 앱이 추천했다고 하면
 *   출처를 잘못 말하는 것이 된다.
 *
 * 표시 게이트는 `scenarioPrefillAtom` 하나다 — 사용자가 무엇이든 바꾸면 영속 계층이
 * 그 atom 을 내리고(승격) 이 배너도 함께 사라진다. 배너 자신은 닫기 버튼을 갖지 않는다:
 * 닫기는 "안 보이지만 여전히 저장되지 않는 상태"를 만들어, 사용자가 자기 데이터가 저장되고 있다고
 * 착각하게 만든다. 사라지는 유일한 방법은 **실제로 무언가를 바꾸는 것**이다.
 *
 * `tone='info'` 는 틴트 면이 아니라 중립 면 + 1px 액센트 테두리다 — 결과 화면의 틴트 상한을 먹지 않는다.
 */
export default function ScenarioPrefillNotice() {
  const prefill = useScenarioPrefillAtomValue();
  // `requested`(아직 화면에 안 붙음) 단계에서는 그리지 않는다 — 결과가 없는데 "미리 계산해 두었다"는
  // 안내만 뜨는 한 프레임이 생긴다.
  if (prefill?.status !== 'applied') return null;

  const preset = PORTFOLIO_PRESET_PLACEHOLDERS.find((candidate) => candidate.id === prefill.presetId);
  if (!preset) return null;

  return (
    <Banner tone="info" role="note" align="center">
      {/*
       * 조사가 **프리셋 이름 뒤에 붙지 않게** 어순을 잡았다. 종전 `"{title}"으로` 는 이름이 모음이나
       * ㄹ 받침으로 끝나면 틀린다("워렌 버핏 스타일**으로**"·"월배당 중독자**으로**"). 이름은 데이터라
       * 앞으로도 늘어나고 라틴 문자로 끝나는 것도 있어("방어형 배당 ETF") 받침 판정만으로는 못 막는다.
       * 조사를 **고정 명사("구성")** 뒤로 옮기면 이름이 무엇이든 문장이 성립한다.
       */}
      {`"${preset.title}" 구성으로 미리 계산해 두었습니다. 아래에서 다른 구성으로 바꿀 수 있습니다.`}
    </Banner>
  );
}
