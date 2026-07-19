import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { getSupabaseClient, updateMyProfile, type CommunityClient } from '@/shared/lib/supabase';
import { isNicknameChanged, validateNickname } from '@/shared/lib/community';
import { useProfileAtomValue, useSessionAtomValue } from '@/jotai/community';
import { useCommunityAuth } from '@/components/community';
import { runAccountDelete } from './accountDeletion';

const p = COMMUNITY_COPY.profile;

/** supabase 에러가 인증(세션 만료/JWT) 계열인지 대략 판별 — 세션 만료 카피 분기용. */
const isAuthError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return (
    message.includes('jwt') ||
    message.includes('token') ||
    message.includes('expired') ||
    message.includes('not authenticated') ||
    message.includes('unauthorized') ||
    message.includes('401')
  );
};

export type ProfileEditor = {
  nickname: {
    value: string;
    onChange: (value: string) => void;
    status: 'idle' | 'saving';
    error: string | null;
    saved: boolean;
    canSave: boolean;
    onSave: () => void;
  };
  deletion: {
    open: boolean;
    submitting: boolean;
    error: string | null;
    onStart: () => void;
    onCancel: () => void;
    onConfirm: () => void;
  };
};

/**
 * 프로필 편집(닉네임·탈퇴)의 상태·IO 배선.
 *
 * - **낙관적 갱신 금지**: 저장 성공 응답 후에만 `refreshProfile()`(DB 재조회)로 atom 을 맞춘다.
 * - 검증 실패/클라 거부(타입·용량)는 **요청을 보내지 않는다**.
 * - 탈퇴는 200 확정 시에만 로그아웃·이동한다(runAccountDelete 계약).
 */
export function useProfileEditor(): ProfileEditor {
  const session = useSessionAtomValue();
  const profile = useProfileAtomValue();
  const { refreshProfile, openLoginPrompt, logout } = useCommunityAuth();
  const navigate = useNavigate();

  const clientRef = useRef<CommunityClient | null>(null);
  const ensureClient = useCallback(async () => {
    if (clientRef.current) return clientRef.current;
    const client = await getSupabaseClient();
    clientRef.current = client;
    return client;
  }, []);

  const userId = session?.user.id ?? null;
  const displayName = profile?.display_name ?? '';

  // ── 닉네임 ────────────────────────────────────────────────────────────────
  const [nicknameInput, setNicknameInput] = useState(displayName);
  const [nicknameStatus, setNicknameStatus] = useState<'idle' | 'saving'>('idle');
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [nicknameSaved, setNicknameSaved] = useState(false);

  // 프로필이 마운트 후 늦게 로드되면(비동기) 사용자가 손대기 전에 한 번만 프리필한다.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!hydratedRef.current && displayName) {
      setNicknameInput(displayName);
      hydratedRef.current = true;
    }
  }, [displayName]);

  const onNicknameChange = useCallback((value: string) => {
    setNicknameInput(value);
    // 다음 입력 변경 시 이전 성공/실패 피드백을 소거한다(토스트 부재 전제).
    setNicknameSaved(false);
    setNicknameError(null);
  }, []);

  const onSaveNickname = useCallback(() => {
    void (async () => {
      const validation = validateNickname(nicknameInput);
      if (!validation.ok) {
        setNicknameSaved(false);
        setNicknameError(p.errorNicknameLength);
        return; // 요청 미발생
      }
      if (!userId) {
        setNicknameError(p.errorSessionExpired);
        openLoginPrompt();
        return;
      }
      setNicknameStatus('saving');
      setNicknameError(null);
      setNicknameSaved(false);
      try {
        const client = await ensureClient();
        if (!client) throw new Error('no client');
        await updateMyProfile(client, userId, { displayName: validation.value });
        await refreshProfile();
        setNicknameSaved(true);
        trackEvent(ANALYTICS_EVENT.PROFILE_UPDATED, { field: 'nickname' });
      } catch (error) {
        if (isAuthError(error)) {
          setNicknameError(p.errorSessionExpired);
          openLoginPrompt();
        } else {
          setNicknameError(p.errorNicknameNetwork);
        }
      } finally {
        setNicknameStatus('idle');
      }
    })();
  }, [nicknameInput, userId, ensureClient, refreshProfile, openLoginPrompt]);

  const canSaveNickname = isNicknameChanged(nicknameInput, displayName) && nicknameStatus === 'idle';

  // ── 회원 탈퇴 ──────────────────────────────────────────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const onStartDelete = useCallback(() => {
    setDeleteError(null);
    setDeleteOpen(true);
    trackEvent(ANALYTICS_EVENT.ACCOUNT_DELETE_STARTED);
  }, []);

  const onCancelDelete = useCallback(() => {
    if (deleteSubmitting) return; // 처리 중 이탈 차단
    setDeleteOpen(false);
    setDeleteError(null);
  }, [deleteSubmitting]);

  const onConfirmDelete = useCallback(() => {
    void (async () => {
      setDeleteSubmitting(true);
      setDeleteError(null);
      const outcome = await runAccountDelete({
        accessToken: session?.access_token,
        onDeleted: async () => {
          // 200 확정 후에만 실행된다(runAccountDelete 계약).
          trackEvent(ANALYTICS_EVENT.ACCOUNT_DELETED);
          await logout();
          navigate('/community/portfolio', { state: { accountDeleted: true } });
        }
      });
      if (!outcome.ok) {
        // 실패 — 다이얼로그 유지, 로그아웃하지 않는다(성공 위장 금지).
        setDeleteSubmitting(false);
        setDeleteError(outcome.reason === 'session' ? p.errorSessionExpired : p.deleteFailed);
      }
      // 성공 시 navigate 로 언마운트되므로 상태 정리 불필요.
    })();
  }, [session, logout, navigate]);

  return {
    nickname: {
      value: nicknameInput,
      onChange: onNicknameChange,
      status: nicknameStatus,
      error: nicknameError,
      saved: nicknameSaved,
      canSave: canSaveNickname,
      onSave: onSaveNickname
    },
    deletion: {
      open: deleteOpen,
      submitting: deleteSubmitting,
      error: deleteError,
      onStart: onStartDelete,
      onCancel: onCancelDelete,
      onConfirm: onConfirmDelete
    }
  };
}
