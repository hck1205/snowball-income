import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  COMMUNITY_BODY_MAX_BYTES,
  COMMUNITY_BODY_MAX_LENGTH,
  COMMUNITY_COPY,
  COMMUNITY_DESCRIPTION_EXCERPT_LENGTH
} from '@/shared/constants/community';
import { ANALYTICS_EVENT, setUserProperties, track } from '@/shared/lib/analytics';
import { deriveExcerpt, htmlToPlainText, isRichTextEmpty, sanitizeRichHtml } from '@/shared/lib/richtext';
import {
  fetchPostDetail,
  getSupabaseClient,
  publishPost,
  updatePost,
  validatePostPayload,
  POST_TITLE_MAX_LENGTH,
  type CommunityClient,
  type PostKind,
  type PostPayload,
  type PostPayloadIssue
} from '@/shared/lib/supabase';
import { useSessionAtomValue } from '@/jotai/community';

const w = COMMUNITY_COPY.write;

export type ComposerLoadState = 'loading' | 'ready' | 'error' | 'forbidden' | 'notfound';

export type ComposerErrors = {
  title?: string;
  body?: string;
  attach?: string;
};

const issueMessage = (issue: PostPayloadIssue): string => {
  switch (issue) {
    case 'too-many-tickers':
      return w.issueTooManyTickers;
    case 'payload-too-large':
      return w.issuePayloadTooLarge;
    default:
      return w.issueMissingSettings;
  }
};

export type UsePostComposer = {
  mode: 'new' | 'edit';
  loadState: ComposerLoadState;
  title: string;
  initialBodyHtml: string;
  isPublic: boolean;
  /**
   * 시뮬 첨부를 이 글에 허용하는가 — `kind==='portfolio'`에서만 true.
   * 뷰는 이 값으로 첨부 섹션 렌더를 결정한다(kind를 각자 해석하지 않도록 단일 출처).
   */
  attachAllowed: boolean;
  /** 첨부된 payload. `attachAllowed=false`(게시판)면 **항상 null**이다. */
  attachedPayload: PostPayload | null;
  errors: ComposerErrors;
  submitError: boolean;
  submitting: boolean;
  dirty: boolean;
  canSubmit: boolean;
  setTitle: (value: string) => void;
  handleBodyChange: (html: string) => void;
  setIsPublic: (value: boolean) => void;
  /** 택1 피커가 고른 시나리오 payload를 첨부한다 — 방어적으로 재검증 후 커밋. */
  attachScenario: (payload: PostPayload) => void;
  detachScenario: () => void;
  submit: () => Promise<void>;
};

/**
 * 글쓰기/수정 폼 상태 + 제출. 게시 규칙: 제목(1–80) 필수 + (본문 비어있지 않거나 시나리오 첨부).
 * 본문은 비제어 에디터가 관리하고, 여기선 최신 HTML만 받아 검증/저장에 쓴다.
 *
 * `kind`(라우트가 결정: 갤러리='portfolio', 게시판='board')는 게시 시 posts.kind로 저장되고,
 * 성공/취소 후 이동할 섹션 목록(sectionBase)을 정한다. 수정 모드는 kind를 바꾸지 않는다(종류 고정).
 */
export const usePostComposer = (postId?: string, kind: PostKind = 'portfolio'): UsePostComposer => {
  const mode: 'new' | 'edit' = postId ? 'edit' : 'new';
  // 섹션 기준 경로 — 목록=sectionBase, 상세=`${sectionBase}/:id`, 글쓰기=`${sectionBase}/write`.
  const sectionBase = kind === 'board' ? '/community/board' : '/community/portfolio';
  const session = useSessionAtomValue();
  const navigate = useNavigate();
  const clientRef = useRef<CommunityClient | null>(null);

  const [loadState, setLoadState] = useState<ComposerLoadState>(mode === 'edit' ? 'loading' : 'ready');
  const [title, setTitleState] = useState('');
  const [initialBodyHtml, setInitialBodyHtml] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  // 새 글 기본값 = 공개. (글쓰기 화면의 토글은 "비공개" 스위치라, off=공개가 기본이다.)
  // 수정 모드에서는 아래에서 detail.is_public 실제 값으로 덮어쓴다.
  const [isPublic, setIsPublicState] = useState(true);
  const [attachedPayload, setAttachedPayload] = useState<PostPayload | null>(null);
  const [errors, setErrors] = useState<ComposerErrors>({});
  const [submitError, setSubmitError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);

  // 시뮬 첨부는 **갤러리(portfolio) 전용**이다. 자유게시판은 순수 텍스트.
  const attachAllowed = kind !== 'board';
  // 게시판에서는 첨부를 "없는 것"으로 취급한다 — 뷰(미리보기/canSubmit)와 제출 검증이 모두 이 값을 본다.
  // ⚠ 내부 state(attachedPayload)는 지우지 않는다: 수정 모드에서 서버가 준 기존 첨부를
  //    보관만 하고 화면/저장에서 배제하기 위함(아래 submit이 payload 키 자체를 안 보낸다 → 서버 값 보존).
  const effectiveAttachedPayload = attachAllowed ? attachedPayload : null;
  /**
   * "본문 대체"로 인정되는 첨부 — **게시 가능 판정에만** 쓰고 저장 인자에는 절대 싣지 않는다.
   *
   * 과거에는 `kind='board' + body=null + payload≠null` 글을 만들 수 있었다. 수정 모드에서
   * effectiveAttachedPayload(=null)만 보면 그런 글이 "내용 없음"으로 판정돼 **제목 오타조차 고칠 수
   * 없게 잠긴다**(첨부는 화면에 안 보이니 원인도 알 수 없다). 그래서 수정 모드에 한해 서버가 준
   * 기존 첨부를 본문 대체로 인정한다. 신규 게시판 글은 여전히 본문 필수(effective=null).
   */
  const bodyAlternativePayload = mode === 'edit' ? attachedPayload : effectiveAttachedPayload;

  const ensureClient = useCallback(async () => {
    if (clientRef.current) return clientRef.current;
    const client = await getSupabaseClient();
    clientRef.current = client;
    return client;
  }, []);

  // 수정 모드: 원본을 불러와 소유권을 확인하고 폼을 채운다.
  useEffect(() => {
    if (mode !== 'edit' || !postId) return;
    if (!session) return; // 비로그인 → 뷰가 로그인 게이트를 보여준다.

    let cancelled = false;
    setLoadState('loading');

    void (async () => {
      const client = await ensureClient();
      if (!client || cancelled) return;
      try {
        const detail = await fetchPostDetail(client, postId);
        if (cancelled) return;
        if (detail.user_id !== session.user.id) {
          setLoadState('forbidden');
          return;
        }
        setTitleState(detail.title);
        setInitialBodyHtml(detail.body ?? '');
        setBodyHtml(detail.body ?? '');
        setIsPublicState(detail.is_public);
        setAttachedPayload(detail.payload);
        setLoadState('ready');
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : '';
        setLoadState(/no rows|0 rows|not found/i.test(message) ? 'notfound' : 'error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ensureClient, mode, postId, session]);

  const setTitle = useCallback((value: string) => {
    setTitleState(value);
    setDirty(true);
    setErrors((prev) => ({ ...prev, title: undefined }));
  }, []);

  const handleBodyChange = useCallback((html: string) => {
    setBodyHtml(html);
    setDirty(true);
    setErrors((prev) => ({ ...prev, body: undefined }));
  }, []);

  const setIsPublic = useCallback((value: boolean) => {
    setIsPublicState(value);
    setDirty(true);
  }, []);

  const attachScenario = useCallback(
    (payload: PostPayload) => {
      // 자유게시판(board)은 순수 텍스트 글이다 — 뷰가 첨부 UI를 아예 안 그리지만,
      // 뷰가 실수해도 첨부가 새지 않도록 훅에서 한 번 더 막는다(무음 no-op).
      if (!attachAllowed) return;
      setErrors((prev) => ({ ...prev, attach: undefined }));
      // 뷰가 이미 selectable 후보만 넘기지만, 커밋 직전 한 번 더 검증한다(신뢰 경계는 서버지만
      // 여기서 막으면 사용자에게 즉시 사유를 말할 수 있다). 실패 매핑은 피커 카드와 동일.
      const issues = validatePostPayload(payload);
      if (issues.length > 0) {
        setErrors((prev) => ({ ...prev, attach: issueMessage(issues[0]) }));
        return;
      }
      setAttachedPayload(payload);
      setDirty(true);
    },
    [attachAllowed]
  );

  const detachScenario = useCallback(() => {
    setAttachedPayload(null);
    setDirty(true);
  }, []);

  const bodyIsEmpty = isRichTextEmpty(bodyHtml);
  const canSubmit = title.trim().length > 0 && (!bodyIsEmpty || bodyAlternativePayload !== null);

  const submit = useCallback(async () => {
    const trimmedTitle = title.trim();
    const nextErrors: ComposerErrors = {};

    if (trimmedTitle.length === 0) nextErrors.title = w.errorTitleRequired;
    else if (trimmedTitle.length > POST_TITLE_MAX_LENGTH) nextErrors.title = w.errorTitleTooLong;

    const emptyBody = isRichTextEmpty(bodyHtml);
    // 실제로 저장되는 HTML을 기준으로 검증한다(서버가 sanitize된 body의 octet_length를 본다).
    const safeBody = emptyBody ? null : sanitizeRichHtml(bodyHtml);

    if (emptyBody && bodyAlternativePayload === null) {
      nextErrors.body = w.errorBodyRequired;
    } else if (!emptyBody && htmlToPlainText(bodyHtml).length > COMMUNITY_BODY_MAX_LENGTH) {
      // UX 보조: plain-text 글자수 상한.
      nextErrors.body = w.errorBodyTooLong;
    } else if (safeBody && new TextEncoder().encode(safeBody).length > COMMUNITY_BODY_MAX_BYTES) {
      // 실제 게시 차단 기준: 서버 CHECK(posts_body_len)와 동일한 UTF-8 바이트 상한.
      nextErrors.body = w.errorBodyTooLarge;
    }

    if (effectiveAttachedPayload) {
      const issues = validatePostPayload(effectiveAttachedPayload);
      if (issues.length > 0) nextErrors.attach = issueMessage(issues[0]);
    }

    if (nextErrors.title || nextErrors.body || nextErrors.attach) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmitError(false);
    setSubmitting(true);

    // 카드 미리보기(description)는 **항상 본문에서 자동 발췌**한다(수동 요약 입력칸 폐지).
    // 본문 없이 첨부만 있는 글은 description=null → 카드는 텍스트 발췌 대신 시뮬 요약을 보여준다.
    const finalDescription = safeBody ? deriveExcerpt(safeBody, COMMUNITY_DESCRIPTION_EXCERPT_LENGTH) : null;

    try {
      const client = await ensureClient();
      if (!client) {
        setSubmitError(true);
        setSubmitting(false);
        return;
      }
      // 첨부 필드는 갤러리에서만 전송한다. 게시판이면 `payload` 키 자체를 뺀다 →
      //   · 신규: 서버 컬럼 기본값(NULL) → sim_summary도 저장 안 됨
      //   · 수정: updatePost가 payload/sim_summary 키를 아예 안 보내 **기존 첨부가 보존**된다
      //          (구 게시판 글에 붙어 있던 첨부를 조용히 지우지 않는다 — 사용자 데이터 보호)
      const attachFields = attachAllowed ? { payload: effectiveAttachedPayload } : {};
      const saved =
        mode === 'edit' && postId
          ? await updatePost(client, postId, {
              title: trimmedTitle,
              description: finalDescription,
              body: safeBody,
              ...attachFields,
              isPublic
            })
          : await publishPost(client, {
              title: trimmedTitle,
              description: finalDescription,
              body: safeBody,
              ...attachFields,
              isPublic,
              kind
            });
      // 새 글 발행 성공 시에만 계측(수정은 발행이 아님). has_sim = 시뮬 첨부 여부(Key Event, 창작 전환).
      if (mode !== 'edit') {
        track(ANALYTICS_EVENT.COMMUNITY_POST_PUBLISHED, { has_sim: effectiveAttachedPayload !== null });
        setUserProperties({ community_active: true });
      }
      setDirty(false);
      navigate(`${sectionBase}/${saved.id}`, { replace: mode === 'edit' });
    } catch {
      setSubmitError(true);
      setSubmitting(false);
    }
  }, [
    attachAllowed,
    bodyAlternativePayload,
    effectiveAttachedPayload,
    bodyHtml,
    ensureClient,
    isPublic,
    kind,
    mode,
    navigate,
    postId,
    sectionBase,
    title
  ]);

  return {
    mode,
    loadState,
    title,
    initialBodyHtml,
    isPublic,
    attachAllowed,
    attachedPayload: effectiveAttachedPayload,
    errors,
    submitError,
    submitting,
    dirty,
    canSubmit,
    setTitle,
    handleBodyChange,
    setIsPublic,
    attachScenario,
    detachScenario,
    submit
  };
};
