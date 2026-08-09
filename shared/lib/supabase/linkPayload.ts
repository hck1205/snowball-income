import type { LinkPayload } from './types';

/**
 * 뉴스 글의 `payload`(서버 jsonb)를 **믿을 수 있는 모양으로 좁힌다**.
 *
 * 🔴 여기 들어오는 문자열은 두 겹으로 남의 것이다: ①우리 DB 의 jsonb 라 어떤 모양이든 들어올 수
 * 있고 ②그 값은 애초에 **남의 웹사이트**에서 뽑아 온 것이다(`api/unfurl`). 그래서 화면은 이
 * 함수를 통과한 값만 쓴다 — `sim_summary` 를 `parseScenarioSimSummary` 로 거르는 것과 같은 규율이다.
 *
 * 무엇을 보나
 *  - `url` 이 **http/https 절대 주소**인가. 아니면 통째로 버린다(카드 전체가 이 주소로 가는 링크라,
 *    여기서 `javascript:` 를 놓치면 그것이 곧 스크립트 실행이다).
 *  - `image` 도 같은 검사를 따로 받는다. 통과하지 못하면 **썸네일만** 버리고 카드는 남긴다.
 *  - 나머지는 문자열로 좁히고 길이를 자른다(원문 복제 방지선이자 레이아웃 방어선).
 *
 * ⚠ 이 함수는 **정화하지 않는다**. HTML 을 지우거나 이스케이프하지 않는다 — 화면이 이 값을
 *   텍스트 노드로만 그리기 때문이다(React 기본). `dangerouslySetInnerHTML` 에 넘기지 마라.
 */

/** 카드 제목 상한. 넘치면 화면이 아니라 여기서 자른다. */
const MAX_TITLE = 200;
/** 요약 상한 — 두세 줄. 🔴 원문을 통째로 담지 않는다는 약속의 마지막 방어선이다. */
const MAX_SUMMARY = 300;
const MAX_SOURCE = 60;

const isHttpUrl = (value: string): boolean => {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

const text = (value: unknown, max: number): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (!trimmed) return undefined;
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
};

export const parseLinkPayload = (value: unknown): LinkPayload | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;

  const url = typeof raw.url === 'string' ? raw.url.trim() : '';
  if (!url || !isHttpUrl(url)) return null;

  const image = typeof raw.image === 'string' ? raw.image.trim() : '';

  return {
    url,
    /* 제목이 없으면 호스트로 떨어진다 — 빈 카드를 만들지 않는다(unfurl 과 같은 처방). */
    title: text(raw.title, MAX_TITLE) ?? new URL(url).hostname.replace(/^www\./, ''),
    ...(text(raw.summary, MAX_SUMMARY) ? { summary: text(raw.summary, MAX_SUMMARY) as string } : {}),
    ...(image && isHttpUrl(image) ? { image } : {}),
    source: text(raw.source, MAX_SOURCE) ?? new URL(url).hostname.replace(/^www\./, '')
  };
};

/** 카드 머리에 서는 출처 표시 — 저장된 `source` 가 비어 있어도 호스트로 떨어진다. */
export const linkHostLabel = (payload: LinkPayload): string => {
  try {
    return new URL(payload.url).hostname.replace(/^www\./, '');
  } catch {
    return payload.source;
  }
};
