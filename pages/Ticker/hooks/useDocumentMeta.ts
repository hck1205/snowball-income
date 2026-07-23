import { useEffect } from 'react';
import { applySeoRuntimeMetadata } from '@/shared/lib/analytics';

export type DocumentMetaInput = {
  /** `<title>` 원본. 사이트명 접미는 이 훅이 붙인다. */
  title: string;
  /** meta description 원본. */
  description: string;
  /** canonical/og:url 을 맞출 라우트 경로(예: '/ticker/schd'). */
  pathname: string;
};

const SITE_SUFFIX = 'Snowball Income';

const setNamedMeta = (name: string, content: string): string | null => {
  const el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) return null;
  const prev = el.content;
  el.content = content;
  return prev;
};

const setPropertyMeta = (property: string, content: string): string | null => {
  const el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) return null;
  const prev = el.content;
  el.content = content;
  return prev;
};

/**
 * SPA 네비게이션 대응 문서 메타 갱신.
 *
 * 크롤러용 정적 메타는 서버 핸들러가 담당하므로(index.html은 JS 없이도 읽힌다), 이 훅은
 * **클라이언트 라우팅으로 진입했을 때** document.title / description / og:* 를 티커별 고유값으로
 * 바꾸고 canonical 을 현재 경로로 맞춘다(`applySeoRuntimeMetadata`). 언마운트 시 이전 값으로
 * 되돌려, 뒤로가기로 메인에 돌아갔을 때 티커 제목이 남지 않게 한다.
 */
export const useDocumentMeta = ({ title, description, pathname }: DocumentMetaInput): void => {
  useEffect(() => {
    // 빈 제목 = 콘텐츠 없음(리다이렉트 예정) — 문서 메타를 건드리지 않는다.
    if (!title) return;

    const fullTitle = `${title} - ${SITE_SUFFIX}`;

    const prevTitle = document.title;
    const prevDescription = setNamedMeta('description', description);
    const prevOgTitle = setPropertyMeta('og:title', fullTitle);
    const prevOgDescription = setPropertyMeta('og:description', description);
    const prevTwitterTitle = setNamedMeta('twitter:title', fullTitle);
    const prevTwitterDescription = setNamedMeta('twitter:description', description);

    document.title = fullTitle;
    applySeoRuntimeMetadata({ pathname });

    return () => {
      document.title = prevTitle;
      if (prevDescription !== null) setNamedMeta('description', prevDescription);
      if (prevOgTitle !== null) setPropertyMeta('og:title', prevOgTitle);
      if (prevOgDescription !== null) setPropertyMeta('og:description', prevOgDescription);
      if (prevTwitterTitle !== null) setNamedMeta('twitter:title', prevTwitterTitle);
      if (prevTwitterDescription !== null) setNamedMeta('twitter:description', prevTwitterDescription);
    };
  }, [title, description, pathname]);
};
