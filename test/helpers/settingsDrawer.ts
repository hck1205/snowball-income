import { screen } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';
import { SIMULATOR_COPY } from '@/shared/constants';

type User = ReturnType<typeof userEvent.setup>;

/**
 * 투자 설정은 **전 해상도에서 드로어** 안에 있다. 패널은 항상 마운트되지만 닫혀 있으면
 * `visibility: hidden` 이라 접근성 트리에서 빠진다(jsdom 도 emotion 이 넣은 이 선언을 계산한다).
 * 그래서 설정 폼을 만지는 모든 동선은 사용자와 똑같이 **"설정 열기"부터** 시작해야 하고,
 * 그 스텝을 빠뜨리면 `getByLabelText('월 적립')` 류가 "찾을 수 없다"로 죽는다.
 *
 * 이미 열려 있으면 아무것도 하지 않는다 — 티커 저장처럼 **드로어를 닫는 동작**(useTickerActions)
 * 뒤에 다시 부르는 호출부가 많아 멱등이어야 한다.
 */
export const openSettingsDrawer = async (user: User): Promise<void> => {
  /* 진입점은 히어로의 "투자 설정" 버튼 하나다(sticky 라 어느 스크롤 위치에서도 닿는다).
     구 헤더 "설정 열기" 버튼은 2026-07-29 에 삭제됐다. */
  const trigger = screen.getByRole('button', { name: SIMULATOR_COPY.settingsTitle });
  if (trigger.getAttribute('aria-expanded') === 'true') return;
  await user.click(trigger);
};

/** 드로어 패널(열려 있을 때만 접근성 트리에 있다). */
export const settingsDrawerPanel = (): HTMLElement =>
  screen.getByRole('complementary', { name: SIMULATOR_COPY.settingsTitle });
