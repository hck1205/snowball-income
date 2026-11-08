import type { ShareFlow } from '@/pages/Main/hooks';

export type ShareFlowLayerProps = {
  /** `useShareFlow` 의 반환값 그대로. 이 레이어는 그리기만 한다. */
  readonly flow: ShareFlow;
};
