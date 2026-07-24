import { useCallback, useEffect, useState } from 'react';
import { Banner } from '@/components/common';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { readKakaoLoginError, stripKakaoLoginError } from '@/shared/lib/supabase';
import { BannerSlot } from './KakaoLoginErrorBanner.styled';

/**
 * 카카오 로그인 실패를 사용자에게 보이게 만드는 배너 (무음 실패 제거).
 * **`NaverLoginErrorBanner` 와 같은 구조·같은 계약**이고 프로바이더(쿼리 플래그·제목)만 다르다.
 *
 * 카카오는 Supabase 기본 프로바이더지만 계정 병합을 피하려고 커스텀 콜백 플로우를 탄다
 * (shared/lib/supabase/kakao.ts). 그 콜백 실패(/api 502 · verifyOtp 에러 · state 불일치 등)는
 * completeKakaoCallback 이 returnTo 에 `?kakaoLogin=failed` 를 달아 커뮤니티 페이지로 되돌린다.
 * 이 플래그를 **커뮤니티 셸에서** 잡아 인라인 에러로 노출한다 — 여기서 잡으면 실패가 어느 커뮤니티
 * 페이지로 착지하든(갤러리 등) 동일하게 보인다. 안 잡으면 사용자는 아무 안내 없이 갤러리만 본다.
 *
 * - 마운트 시 1회 `window.location.search` 를 읽는다. 성공/일반 방문엔 플래그가 없어 no-op(배너 없음).
 * - 닫으면 URL 에서 **kakaoLogin 플래그만** 스트립(share/sv 등 불변) — 새로고침·공유에 에러가 남지 않게.
 * - Banner `role="alert"` 로 스크린리더가 즉시 인지한다.
 *
 * 제목은 컴포넌트 로컬 카피다(NaverLoginErrorBanner 와 같은 선례): 실패 "원인(카카오 로그인)"을
 * 드러내야 하는데 copy.ts 에 해당 키가 없고, 본문은 정본 `common.genericError` 를 재사용한다.
 */
const KAKAO_LOGIN_ERROR_TITLE = '카카오 로그인에 실패했어요';

export default function KakaoLoginErrorBanner() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && readKakaoLoginError(window.location.search)) {
      setFailed(true);
    }
  }, []);

  const dismiss = useCallback(() => {
    setFailed(false);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', stripKakaoLoginError(window.location.href));
    }
  }, []);

  if (!failed) return null;

  return (
    <BannerSlot>
      <Banner
        tone="danger"
        role="alert"
        title={KAKAO_LOGIN_ERROR_TITLE}
        onDismiss={dismiss}
        dismissAriaLabel={COMMUNITY_COPY.common.close}
      >
        {COMMUNITY_COPY.common.genericError}
      </Banner>
    </BannerSlot>
  );
}
