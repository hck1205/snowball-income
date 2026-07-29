import { CloudOff, CloudDownload, TriangleAlert } from 'lucide-react';
import { Banner, Button } from '@/components/common';
import { ICON } from '@/shared/styles';
import type { CloudSyncNoticeProps } from './CloudSyncNotice.types';
import { NoticeRow, NoticeText } from './CloudSyncNotice.styled';

/**
 * 포트폴리오 클라우드 상태를 **말하는** 줄.
 *
 * 세 가지만 말한다:
 *  - **비로그인** — "새로고침하면 사라진다". 이 화면의 데이터는 이 브라우저에만 있고, 방문 기록을
 *    지우거나 다른 기기로 가면 없다. 그 사실을 숨기면 사용자는 잃고 나서야 안다.
 *  - **덮어씀** — 클라우드에 저장돼 있던 것으로 맞췄다. 이 화면은 "클라우드가 이긴다" 정책이라
 *    **이 기기에만 있던 편집이 사라질 수 있다** — 무음으로 넘어가지 않는다.
 *  - **실패** — 못 맞췄다. 로컬은 그대로라는 것까지 말해야 사용자가 불안해하지 않는다.
 *
 * `synced`·`syncing` 은 **아무 것도 그리지 않는다.** 잘 되고 있다는 말은 자리를 차지할 가치가 없다
 * (이 레포의 CloudSyncIndicator 가 평상시 숨는 것과 같은 판단).
 */
export default function CloudSyncNotice({ status, canSignIn, onDismissApplied, onRetry }: CloudSyncNoticeProps) {
  if (status === 'signed-out') {
    // 로그인을 못 하는 배포에서는 유도할 곳이 없다 — 불안만 남기고 해결책이 없는 문구는 쓰지 않는다.
    if (!canSignIn) return null;

    /*
     * 로그인 버튼을 여기 두지 않고 **헤더의 것을 가리킨다.** 로그인 모달은 `CommunityAuthProvider`
     * 아래에서만 열 수 있는데 그 Provider 는 `/community/*` 에만 있다. 이 화면에서 모달을 열려고
     * Provider 를 끌어오면 이 페이지가 커뮤니티에 결합된다 — 지금은 완전히 독립이다.
     */
    return (
      <Banner tone="info">
        <NoticeRow>
          <CloudOff size={ICON.md} strokeWidth={ICON.stroke} aria-hidden focusable={false} />
          <NoticeText>
            지금 이 포트폴리오는 <strong>이 브라우저에만</strong> 저장됩니다. 방문 기록을 지우거나 다른 기기에서
            열면 보이지 않습니다. 위쪽 <strong>로그인</strong> 버튼으로 로그인하면 클라우드에 보관되어 어디서든
            이어서 볼 수 있습니다.
          </NoticeText>
        </NoticeRow>
      </Banner>
    );
  }

  if (status === 'applied-cloud') {
    return (
      <Banner tone="info">
        <NoticeRow>
          <CloudDownload size={ICON.md} strokeWidth={ICON.stroke} aria-hidden focusable={false} />
          <NoticeText>
            클라우드에 저장된 포트폴리오로 맞췄습니다. 이 기기에만 있던 변경이 있었다면 덮어써졌습니다.
          </NoticeText>
          <Button type="button" variant="ghost" size="sm" onClick={onDismissApplied}>
            확인
          </Button>
        </NoticeRow>
      </Banner>
    );
  }

  if (status === 'failed') {
    return (
      <Banner tone="danger">
        <NoticeRow>
          <TriangleAlert size={ICON.md} strokeWidth={ICON.stroke} aria-hidden focusable={false} />
          <NoticeText>
            클라우드와 맞추지 못했습니다. <strong>이 기기의 포트폴리오는 그대로</strong>이니 계속 쓰셔도 됩니다.
          </NoticeText>
          {/*
            실패는 **스스로 낫지 않는다** — 이 상태에서는 올리기도 막아둔다(클라우드를 못 읽은 채
            올리면 정본을 덮는다). 그래서 다시 시도할 수단을 반드시 함께 준다.
          */}
          <Button type="button" variant="ghost" size="sm" onClick={onRetry}>
            다시 시도
          </Button>
        </NoticeRow>
      </Banner>
    );
  }

  return null;
}
