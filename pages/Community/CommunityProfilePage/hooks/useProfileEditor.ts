import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { getSupabaseClient, isNicknameTaken, updateMyProfile, type CommunityClient } from '@/shared/lib/supabase';
import { isNicknameChanged, validateNickname } from '@/shared/lib/community';
import { useProfileAtomValue, useSessionAtomValue } from '@/jotai/community';
import { useCommunityAuth } from '@/components/community';
import { runAccountDelete } from './accountDeletion';

const p = COMMUNITY_COPY.profile;

/** 입력이 멎었다고 보는 시간. 짧으면 타이핑 중 요청이 쏟아지고, 길면 저장 버튼이 늦게 풀린다. */
const NICKNAME_CHECK_DEBOUNCE_MS = 400;

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

/**
 * 닉네임 UNIQUE 인덱스(`profiles_display_name_lower_key`) 위반인지 판별한다.
 *
 * Postgres 의 unique_violation = `23505`. 저장 직전 재확인을 통과하고도 여기 걸렸다면
 * 그 사이에 다른 사람이 같은 닉네임을 확정한 것 — 즉 경합의 패자다.
 * (`code` 는 `updateMyProfile` 이 PostgREST 에러에서 보존해 던진다.)
 */
const isNicknameConflict = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: unknown }).code === '23505';

/** 닉네임 중복 검사 상태. `available` 이라야 저장할 수 있다(무검사 저장 금지). */
export type NicknameAvailability = 'idle' | 'checking' | 'available' | 'taken' | 'failed';

export type ProfileEditor = {
  nickname: {
    value: string;
    onChange: (value: string) => void;
    status: 'idle' | 'saving';
    availability: NicknameAvailability;
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

  const [availability, setAvailability] = useState<NicknameAvailability>('idle');

  const onNicknameChange = useCallback((value: string) => {
    setNicknameInput(value);
    // 다음 입력 변경 시 이전 성공/실패 피드백을 소거한다(토스트 부재 전제).
    setNicknameSaved(false);
    setNicknameError(null);
    // 입력이 바뀌면 직전 검사 결과는 **다른 값에 대한 것**이라 무효다. 여기서 지우지 않으면
    // "available" 이 남아 새 값이 미검사 상태로 저장돼 버린다.
    setAvailability('idle');
  }, []);

  /**
   * 입력이 멎으면 중복을 조회한다(디바운스).
   *
   * 타이핑마다 쏘지 않는 이유는 요청 수도 있지만, **응답 역전** 때문이다 — 늦게 출발한 요청이 먼저
   * 오면 옛 값의 결과가 화면에 남는다. 그래서 매 실행에 `cancelled` 플래그를 두고, 정리 함수가
   * 이전 실행의 결과 반영을 막는다(= 항상 마지막 입력의 결과만 쓴다).
   */
  useEffect(() => {
    const validation = validateNickname(nicknameInput);
    // 길이 미달/초과이거나 원래 값 그대로면 검사할 게 없다(저장 버튼도 어차피 잠긴다).
    if (!validation.ok || !isNicknameChanged(nicknameInput, displayName) || !userId) {
      setAvailability('idle');
      return;
    }

    let cancelled = false;
    setAvailability('checking');

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const client = await ensureClient();
          if (!client) throw new Error('no client');
          const taken = await isNicknameTaken(client, validation.value, userId);
          if (cancelled) return;
          setAvailability(taken ? 'taken' : 'available');
          // 사유는 저장 버튼 옆이 아니라 인라인으로 즉시 보여준다(저장을 눌러야 알게 하지 않는다).
          setNicknameError(taken ? p.errorNicknameTaken : null);
        } catch {
          if (cancelled) return;
          // 검사 실패를 "사용 가능"으로 위장하지 않는다 — 저장은 잠긴 채로 사유를 알린다.
          setAvailability('failed');
          setNicknameError(p.errorNicknameCheckFailed);
        }
      })();
    }, NICKNAME_CHECK_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [nicknameInput, displayName, userId, ensureClient]);

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
        // 저장 직전 **다시 확인한다.** 디바운스 검사 이후 다른 사람이 그 닉네임을 가져갔을 수 있고,
        // 버튼 활성 상태만 믿으면 그 창(window)을 그대로 통과한다. UNIQUE 제약이 없어 DB 가
        // 막아주지 않으므로 여기가 마지막 방어선이다.
        if (await isNicknameTaken(client, validation.value, userId)) {
          setAvailability('taken');
          setNicknameError(p.errorNicknameTaken);
          return;
        }
        await updateMyProfile(client, userId, { displayName: validation.value });
        await refreshProfile();
        setNicknameSaved(true);
        trackEvent(ANALYTICS_EVENT.PROFILE_UPDATED, { field: 'nickname' });
      } catch (error) {
        if (isAuthError(error)) {
          setNicknameError(p.errorSessionExpired);
          openLoginPrompt();
        } else if (isNicknameConflict(error)) {
          // 위 재확인을 통과했는데도 DB 가 거절한 경우 = 진짜 동시 저장의 패자.
          // 네트워크 오류로 뭉뚱그리면 사용자는 재시도만 반복하게 된다 — 사실대로 말한다.
          setAvailability('taken');
          setNicknameError(p.errorNicknameTaken);
        } else {
          setNicknameError(p.errorNicknameNetwork);
        }
      } finally {
        setNicknameStatus('idle');
      }
    })();
  }, [nicknameInput, userId, ensureClient, refreshProfile, openLoginPrompt]);

  /**
   * 저장 가능 = 값이 바뀌었고 · 저장 중이 아니고 · **중복 검사를 통과했을 때**.
   * `checking`/`taken`/`failed`/`idle` 은 전부 잠긴다 — 검사 없이 저장되는 경로를 남기지 않는다.
   */
  const canSaveNickname =
    isNicknameChanged(nicknameInput, displayName) && nicknameStatus === 'idle' && availability === 'available';

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
      availability,
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
