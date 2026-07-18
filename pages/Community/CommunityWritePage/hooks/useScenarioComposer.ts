import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  COMMUNITY_BODY_MAX_BYTES,
  COMMUNITY_BODY_MAX_LENGTH,
  COMMUNITY_COPY,
  COMMUNITY_DESCRIPTION_EXCERPT_LENGTH
} from '@/shared/constants/community';
import { deriveExcerpt, htmlToPlainText, isRichTextEmpty, sanitizeRichHtml } from '@/shared/lib/richtext';
import {
  fetchScenarioDetail,
  getSupabaseClient,
  publishScenario,
  updateScenario,
  validateScenarioPayload,
  SCENARIO_TITLE_MAX_LENGTH,
  type CommunityClient,
  type ScenarioPayload,
  type ScenarioPayloadIssue
} from '@/shared/lib/supabase';
import { useSessionAtomValue } from '@/jotai/community';

const w = COMMUNITY_COPY.write;

export type ComposerLoadState = 'loading' | 'ready' | 'error' | 'forbidden' | 'notfound';

export type ComposerErrors = {
  title?: string;
  body?: string;
  attach?: string;
};

const issueMessage = (issue: ScenarioPayloadIssue): string => {
  switch (issue) {
    case 'too-many-tickers':
      return w.issueTooManyTickers;
    case 'payload-too-large':
      return w.issuePayloadTooLarge;
    default:
      return w.issueMissingSettings;
  }
};

export type UseScenarioComposer = {
  mode: 'new' | 'edit';
  loadState: ComposerLoadState;
  title: string;
  initialBodyHtml: string;
  isPublic: boolean;
  attachedPayload: ScenarioPayload | null;
  errors: ComposerErrors;
  submitError: boolean;
  submitting: boolean;
  dirty: boolean;
  canSubmit: boolean;
  setTitle: (value: string) => void;
  handleBodyChange: (html: string) => void;
  setIsPublic: (value: boolean) => void;
  /** 택1 피커가 고른 시나리오 payload를 첨부한다 — 방어적으로 재검증 후 커밋. */
  attachScenario: (payload: ScenarioPayload) => void;
  detachScenario: () => void;
  submit: () => Promise<void>;
};

/**
 * 글쓰기/수정 폼 상태 + 제출. 게시 규칙: 제목(1–80) 필수 + (본문 비어있지 않거나 시나리오 첨부).
 * 본문은 비제어 에디터가 관리하고, 여기선 최신 HTML만 받아 검증/저장에 쓴다.
 */
export const useScenarioComposer = (scenarioId?: string): UseScenarioComposer => {
  const mode: 'new' | 'edit' = scenarioId ? 'edit' : 'new';
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
  const [attachedPayload, setAttachedPayload] = useState<ScenarioPayload | null>(null);
  const [errors, setErrors] = useState<ComposerErrors>({});
  const [submitError, setSubmitError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);

  const ensureClient = useCallback(async () => {
    if (clientRef.current) return clientRef.current;
    const client = await getSupabaseClient();
    clientRef.current = client;
    return client;
  }, []);

  // 수정 모드: 원본을 불러와 소유권을 확인하고 폼을 채운다.
  useEffect(() => {
    if (mode !== 'edit' || !scenarioId) return;
    if (!session) return; // 비로그인 → 뷰가 로그인 게이트를 보여준다.

    let cancelled = false;
    setLoadState('loading');

    void (async () => {
      const client = await ensureClient();
      if (!client || cancelled) return;
      try {
        const detail = await fetchScenarioDetail(client, scenarioId);
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
  }, [ensureClient, mode, scenarioId, session]);

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

  const attachScenario = useCallback((payload: ScenarioPayload) => {
    setErrors((prev) => ({ ...prev, attach: undefined }));
    // 뷰가 이미 selectable 후보만 넘기지만, 커밋 직전 한 번 더 검증한다(신뢰 경계는 서버지만
    // 여기서 막으면 사용자에게 즉시 사유를 말할 수 있다). 실패 매핑은 피커 카드와 동일.
    const issues = validateScenarioPayload(payload);
    if (issues.length > 0) {
      setErrors((prev) => ({ ...prev, attach: issueMessage(issues[0]) }));
      return;
    }
    setAttachedPayload(payload);
    setDirty(true);
  }, []);

  const detachScenario = useCallback(() => {
    setAttachedPayload(null);
    setDirty(true);
  }, []);

  const bodyIsEmpty = isRichTextEmpty(bodyHtml);
  const canSubmit = title.trim().length > 0 && (!bodyIsEmpty || attachedPayload !== null);

  const submit = useCallback(async () => {
    const trimmedTitle = title.trim();
    const nextErrors: ComposerErrors = {};

    if (trimmedTitle.length === 0) nextErrors.title = w.errorTitleRequired;
    else if (trimmedTitle.length > SCENARIO_TITLE_MAX_LENGTH) nextErrors.title = w.errorTitleTooLong;

    const emptyBody = isRichTextEmpty(bodyHtml);
    // 실제로 저장되는 HTML을 기준으로 검증한다(서버가 sanitize된 body의 octet_length를 본다).
    const safeBody = emptyBody ? null : sanitizeRichHtml(bodyHtml);

    if (emptyBody && attachedPayload === null) {
      nextErrors.body = w.errorBodyRequired;
    } else if (!emptyBody && htmlToPlainText(bodyHtml).length > COMMUNITY_BODY_MAX_LENGTH) {
      // UX 보조: plain-text 글자수 상한.
      nextErrors.body = w.errorBodyTooLong;
    } else if (safeBody && new TextEncoder().encode(safeBody).length > COMMUNITY_BODY_MAX_BYTES) {
      // 실제 게시 차단 기준: 서버 CHECK(scenarios_body_len)와 동일한 UTF-8 바이트 상한.
      nextErrors.body = w.errorBodyTooLarge;
    }

    if (attachedPayload) {
      const issues = validateScenarioPayload(attachedPayload);
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
      const saved =
        mode === 'edit' && scenarioId
          ? await updateScenario(client, scenarioId, {
              title: trimmedTitle,
              description: finalDescription,
              body: safeBody,
              payload: attachedPayload,
              isPublic
            })
          : await publishScenario(client, {
              title: trimmedTitle,
              description: finalDescription,
              body: safeBody,
              payload: attachedPayload,
              isPublic
            });
      setDirty(false);
      navigate(`/community/${saved.id}`, { replace: mode === 'edit' });
    } catch {
      setSubmitError(true);
      setSubmitting(false);
    }
  }, [attachedPayload, bodyHtml, ensureClient, isPublic, mode, navigate, scenarioId, title]);

  return {
    mode,
    loadState,
    title,
    initialBodyHtml,
    isPublic,
    attachedPayload,
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
