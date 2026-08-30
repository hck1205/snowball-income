import type { OverlayPresence } from '@/shared/hooks';
import type { LedgerFormModel, LedgerRemoveTarget } from '../../types';
import type { LedgerViewProps } from '../../LedgerPage/LedgerPage.types';

/**
 * 오버레이 셋의 props.
 *
 * 🔴 **본체 뷰에서 가른 이유**(2026-08-31): `LedgerPageView` 는 901줄이었고, 그중 오버레이는
 * "본문 밖에 뜨는 것"이라 나머지와 관심사가 다르다. 경계가 뚜렷한 곳부터 가르면 다음 사람이
 * 본문을 읽을 때 오버레이 조건문을 건너뛰지 않아도 된다.
 *
 * 🔴 콜백 타입은 **`LedgerViewProps` 에서 그대로 집어 온다**(`Pick`). 여기서 다시 적으면 시그니처가
 * 조용히 갈라지고, 그건 타입이 있는데도 못 잡는 종류의 드리프트다.
 *
 * ⚠ 열림/닫힘 **애니메이션 잔상**(`useOverlayPresence`)은 본체가 소유한다 — 그 훅이 뷰의 다른
 *   상태와 함께 살아야 모달이 사라지는 동안의 프레임이 맞는다. 여기는 그 결과(`value`+`phase`)만 받는다.
 */
export type LedgerOverlaysProps = Pick<
  LedgerViewProps,
  | 'onSideFormChange'
  | 'onSideFormSubmit'
  | 'onSideFormClose'
  | 'onFormChange'
  | 'onSubmitForm'
  | 'onCloseForm'
  | 'onConfirmRemove'
  | 'onCloseRemove'
  | 'onReconnect'
  | 'onRefresh'
> & {
  /** 화면 모델 — 오버레이가 보는 것은 폼·삭제·만료 상태뿐이다. */
  viewModel: LedgerViewProps['viewModel'];
  /**
   * 잔상 포함 폼 값. `viewModel.form` 이 실제 열림이고 이쪽은 **사라지는 중에도 값이 남는다**.
   * ⚠ 타입을 손으로 적지 않고 `OverlayPresence` 를 쓴다 — phase 는 `'enter' | 'exit'` 뿐이라
   *   `string` 으로 넓히면 모달이 잘못된 상태로 그려져도 타입이 잡지 못한다.
   */
  form: OverlayPresence<LedgerFormModel>;
  removeTarget: OverlayPresence<LedgerRemoveTarget>;
  /** 만료 안내 문구의 id — 세 오버레이가 같은 줄을 가리킨다(무음 비활성 금지). */
  expiredHintId: string;
};
