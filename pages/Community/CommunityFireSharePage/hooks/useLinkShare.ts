import { useCallback, useRef, useState } from 'react';
import { getSupabaseClient, publishPost, type LinkPayload } from '@/shared/lib/supabase';

export type LinkShareStatus = 'idle' | 'fetching' | 'ready' | 'submitting';

export type UseLinkShareResult = {
  url: string;
  setUrl: (value: string) => void;
  /** 미리 보기가 잡히면 채워진다. 실패해도 사용자가 제목을 직접 적으면 게시할 수 있다. */
  preview: LinkPayload | null;
  title: string;
  setTitle: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
  status: LinkShareStatus;
  /** 사람이 읽는 실패 문구. null 이면 문제 없음. */
  error: string | null;
  fetchPreview: () => void;
  submit: () => Promise<string | null>;
  canSubmit: boolean;
};

const isHttpUrl = (value: string): boolean => {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * 링크 공유 화면의 상태.
 *
 * ## 🔴 순서가 이 화면의 전부다
 * **주소 한 칸에서 시작한다.** 붙여넣으면 서버가 제목·요약·썸네일을 가져오고, 사용자는 한 줄만
 * 덧붙여 올린다. 제목부터 적게 하면 그 순간 이 화면은 "글쓰기"가 되고, 사람들은 원문을 옮겨
 * 적기 시작한다 — 그건 우리가 하려는 일이 아니다(저작권 · LinkPayload 주석).
 *
 * ## 실패해도 막다른 길이 아니다
 * ⚠ 미리 보기는 **실패할 수 있다**(봇 차단·JS 렌더·타임아웃). 그때 화면이 멈추면 사용자는
 * 아무것도 못 한다. 그래서 실패하면 제목 칸을 열어 두고 **직접 적어 올릴 수 있게** 둔다 —
 * url 만 있으면 카드는 성립한다(제목이 없으면 호스트명으로 떨어진다).
 */
export const useLinkShare = (copy: {
  invalidUrl: string;
  fetchFailed: string;
  submitFailed: string;
}): UseLinkShareResult => {
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState<LinkPayload | null>(null);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<LinkShareStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  /* 늦게 도착한 옛 미리 보기가 새 주소의 결과를 덮지 않게 한다(목록 훅들과 같은 가드). */
  const requestIdRef = useRef(0);

  const fetchPreview = useCallback(() => {
    const target = url.trim();
    if (!isHttpUrl(target)) {
      setError(copy.invalidUrl);
      return;
    }

    const requestId = (requestIdRef.current += 1);
    setStatus('fetching');
    setError(null);

    void (async () => {
      try {
        const response = await fetch(`/api/unfurl?url=${encodeURIComponent(target)}`);
        if (requestId !== requestIdRef.current) return;

        if (!response.ok) {
          /* 🔴 막다른 길로 두지 않는다 — 제목을 직접 적으면 올릴 수 있다. */
          setPreview({ url: target, title: '', source: '' });
          setStatus('ready');
          setError(copy.fetchFailed);
          return;
        }

        const data = (await response.json()) as LinkPayload;
        if (requestId !== requestIdRef.current) return;
        setPreview(data);
        setTitle(data.title ?? '');
        setStatus('ready');
      } catch {
        if (requestId !== requestIdRef.current) return;
        setPreview({ url: target, title: '', source: '' });
        setStatus('ready');
        setError(copy.fetchFailed);
      }
    })();
  }, [copy.fetchFailed, copy.invalidUrl, url]);

  const canSubmit = status === 'ready' && preview !== null && title.trim().length > 0;

  const submit = useCallback(async (): Promise<string | null> => {
    if (!preview || !canSubmit) return null;
    setStatus('submitting');
    setError(null);

    try {
      const client = await getSupabaseClient();
      if (!client) throw new Error('no client');

      const payload: LinkPayload = {
        url: preview.url,
        title: title.trim(),
        ...(preview.summary ? { summary: preview.summary } : {}),
        ...(preview.image ? { image: preview.image } : {}),
        source: preview.source || new URL(preview.url).hostname.replace(/^www\./, '')
      };

      const saved = await publishPost(client, {
        title: payload.title,
        /* 한 줄 감상은 `description` 이다 — 목록 카드가 원문 요약과 나란히 그린다. */
        description: note.trim() || null,
        payload,
        kind: 'fire',
        /* 🔴 뉴스는 **공개가 기본**이다. 모으는 것이 목적이라 비공개 뉴스는 뜻이 없다. */
        isPublic: true
      });

      return saved.id;
    } catch {
      setError(copy.submitFailed);
      setStatus('ready');
      return null;
    }
  }, [canSubmit, copy.submitFailed, note, preview, title]);

  return {
    url,
    setUrl,
    preview,
    title,
    setTitle,
    note,
    setNote,
    status,
    error,
    fetchPreview,
    submit,
    canSubmit
  };
};
