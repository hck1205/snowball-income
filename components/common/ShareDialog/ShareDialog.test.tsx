import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShareDialog from './ShareDialog';
import { SHARE_CHANNELS, SHARE_DIALOG_COPY, buildShareChannelUrl, isNativeShareIdiomatic } from './ShareDialog.utils';

const URL_UNDER_TEST = 'https://snowball.example/community/portfolio/p1?tab=1';

const ORIGINAL_MATCH_MEDIA = Object.getOwnPropertyDescriptor(window, 'matchMedia');

const stubMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({ matches, media: query, addEventListener: () => undefined })
  });
};

afterEach(() => {
  delete (navigator as { share?: unknown }).share;
  if (ORIGINAL_MATCH_MEDIA) Object.defineProperty(window, 'matchMedia', ORIGINAL_MATCH_MEDIA);
});

describe('공유 채널 주소', () => {
  it('주소와 제목을 인코딩해 채널 인텐트를 만든다(원문 그대로 붙이지 않는다)', () => {
    const built = buildShareChannelUrl('x', URL_UNDER_TEST, '내 배당 포트폴리오');

    expect(built).toContain(encodeURIComponent(URL_UNDER_TEST));
    // 인코딩하지 않으면 쿼리스트링의 `?`·`&` 가 인텐트 파라미터를 갈라 링크가 깨진다.
    expect(built).not.toContain('?tab=1&');
  });

  it('모르는 채널이면 null 이다(호출부가 조용히 무시할 수 있게)', () => {
    expect(buildShareChannelUrl('kakao' as never, URL_UNDER_TEST, '제목')).toBeNull();
  });

  it('모든 채널이 https 인텐트만 쓴다(SDK·앱키 필요한 채널 없음)', () => {
    for (const channel of SHARE_CHANNELS) {
      expect(channel.buildUrl(URL_UNDER_TEST, '제목').startsWith('https://')).toBe(true);
    }
  });
});

/**
 * 이 판정이 이 부품이 존재하는 이유다 — 데스크톱 브라우저도 `navigator.share` 를 갖고 있어서
 * "있으면 쓴다"로 분기하면 앱이 손댈 수 없는 OS 창이 열린다(잘려 보인다는 신고의 원인).
 */
describe('네이티브 공유 시트 사용 판정', () => {
  it('navigator.share 가 있어도 마우스 기기면 거짓이다', () => {
    Object.defineProperty(navigator, 'share', { value: () => Promise.resolve(), configurable: true });
    stubMatchMedia(false);

    expect(isNativeShareIdiomatic()).toBe(false);
  });

  it('터치가 주 입력이고 navigator.share 가 있으면 참이다', () => {
    Object.defineProperty(navigator, 'share', { value: () => Promise.resolve(), configurable: true });
    stubMatchMedia(true);

    expect(isNativeShareIdiomatic()).toBe(true);
  });

  it('navigator.share 자체가 없으면 터치 기기여도 거짓이다', () => {
    stubMatchMedia(true);

    expect(isNativeShareIdiomatic()).toBe(false);
  });
});

describe('공유 창', () => {
  const renderDialog = (overrides: Partial<Parameters<typeof ShareDialog>[0]> = {}) => {
    const props = {
      url: URL_UNDER_TEST,
      onCopy: vi.fn(),
      onSelectChannel: vi.fn(),
      onClose: vi.fn(),
      ...overrides
    };
    render(<ShareDialog {...props} />);
    return props;
  };

  it('주소를 읽기 전용 입력으로 보여 준다 — 클립보드가 막혀도 직접 복사할 수 있어야 한다', () => {
    renderDialog();

    const input = screen.getByLabelText(SHARE_DIALOG_COPY.linkLabel) as HTMLInputElement;
    expect(input.value).toBe(URL_UNDER_TEST);
    expect(input).toHaveAttribute('readonly');
  });

  it('열리면 1급 동작(링크 복사)에 포커스가 있다', () => {
    renderDialog();

    expect(screen.getByRole('button', { name: SHARE_DIALOG_COPY.copy })).toHaveFocus();
  });

  it('복사 뒤에는 버튼 라벨이 결과를 말한다(색이 아니라 글자로)', () => {
    renderDialog({ isCopied: true });

    expect(screen.getByRole('button', { name: SHARE_DIALOG_COPY.copied })).toBeInTheDocument();
  });

  it('채널 버튼은 이름을 접근명으로 갖고 그 채널 id 로 콜백한다', async () => {
    const props = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: SHARE_DIALOG_COPY.channelAria('X') }));

    expect(props.onSelectChannel).toHaveBeenCalledWith('x');
  });

  it('Escape 로 닫힌다', async () => {
    const props = renderDialog();

    await userEvent.keyboard('{Escape}');

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
