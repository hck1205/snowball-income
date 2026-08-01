import { Banner } from '@/components/common';
import { useSetShareLinkFailureWrite, useShareLinkFailureAtomValue } from '@/jotai';
import type { ShareLinkFailureReason } from '@/jotai';

/**
 * 사유별 안내 문구. 사용자가 다음에 할 수 있는 행동이 다르므로 문장을 나눈다
 * (링크를 다시 받아야 하는가 vs 그 시나리오가 이제 없는가).
 */
const MESSAGE: Record<ShareLinkFailureReason, string> = {
  invalid: '공유 링크가 손상되었거나 일부만 전달되어 시나리오를 열지 못했습니다. 링크를 보낸 분께 주소 전체를 다시 받아 주세요.',
  unavailable: '공유된 시나리오를 찾지 못했습니다. 링크가 만료되었거나 일시적인 연결 문제일 수 있습니다.'
};

/**
 * 공유 링크 실패 안내.
 *
 * 잘린 `?share=` 코드 하나로 앱이 통째로 죽던 자리의 **나머지 절반**이다. 파싱 경계가 실패를
 * 값으로 돌려주면 화면은 빈 시뮬레이터로 떨어지는데, **왜 비었는지 말하지 않으면**
 * 사용자는 "내 시나리오가 사라졌다"로 읽는다 — 조용한 실패는 성공의 위장이다.
 *
 * 표시 게이트는 `shareLinkFailureAtom` 하나이고, 그 값은 영속 계층(`usePortfolioPersistence`)의
 * 공유 복원 effect만 쓴다. 여기서는 읽고 닫기만 한다 — 닫기는 데이터에 아무 영향이 없다
 * (`ScenarioPrefillNotice` 가 일부러 닫기를 갖지 않는 것과 반대 이유: 저 배너는 "저장이 멈춰 있다"는
 * 진행 중인 상태를 말하지만, 이 배너는 이미 끝난 사건을 말한다).
 */
export default function ShareLinkFailureNotice() {
  const failure = useShareLinkFailureAtomValue();
  const setFailure = useSetShareLinkFailureWrite();

  if (!failure) return null;

  return (
    <Banner
      tone="warning"
      role="status"
      align="center"
      onDismiss={() => setFailure(null)}
      dismissAriaLabel="공유 링크 안내 닫기"
    >
      {MESSAGE[failure]}
    </Banner>
  );
}
