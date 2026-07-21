/**
 * 커뮤니티 목록/상세의 표시 변환 — 순수 함수.
 */

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

/**
 * ISO 타임스탬프 → "방금 전 / n분 전 / n시간 전 / n일 전 / n주 전 / n개월 전 / n년 전".
 * `now`를 주입받아 결정적으로 테스트할 수 있게 한다.
 * 파싱 불가하면 빈 문자열(호출부가 절대시간 title로 폴백).
 */
export const formatRelativeTime = (iso: string, now: Date = new Date()): string => {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';

  const diffSeconds = Math.round((now.getTime() - then) / 1000);
  if (diffSeconds < 0) return '방금 전';
  if (diffSeconds < MINUTE) return '방금 전';
  if (diffSeconds < HOUR) return `${Math.floor(diffSeconds / MINUTE)}분 전`;
  if (diffSeconds < DAY) return `${Math.floor(diffSeconds / HOUR)}시간 전`;
  if (diffSeconds < WEEK) return `${Math.floor(diffSeconds / DAY)}일 전`;
  if (diffSeconds < MONTH) return `${Math.floor(diffSeconds / WEEK)}주 전`;
  // MONTH=30d·YEAR=365d라 360~364일이 "12개월"로 새어나갈 수 있다 → 개월 표기는 11로 클램프하고
  // 365일 이상은 "n년 전"으로 넘긴다.
  if (diffSeconds < YEAR) return `${Math.min(11, Math.floor(diffSeconds / MONTH))}개월 전`;
  return `${Math.floor(diffSeconds / YEAR)}년 전`;
};

/** ISO → 로케일 절대시간(스크린리더/툴팁용 title). 파싱 불가하면 원본을 그대로 돌려준다. */
export const formatAbsoluteTime = (iso: string): string => {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return iso;
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

/** 아바타 폴백용 이니셜(닉네임 첫 글자). 빈 이름은 '?'. */
export const getAvatarInitial = (displayName: string | null | undefined): string => {
  const trimmed = (displayName ?? '').trim();
  if (!trimmed) return '?';
  // 코드포인트 단위로 첫 글자를 뽑는다(이모지/서러게이트 쌍 안전).
  return [...trimmed][0]?.toUpperCase() ?? '?';
};

/**
 * 상세 경로(`/community/board/:id`)를 공유용 **절대 공개 URL**로 만든다.
 * origin을 주입받아 결정적으로 테스트할 수 있게 하고, 미지정 시 현재 문서 origin을 읽는다.
 * origin을 못 구하면(SSR 등) 경로를 그대로 돌려준다 — 훅이 다시 window.location.href로 폴백한다.
 */
export const buildPostShareUrl = (
  detailPath: string,
  origin: string | undefined = typeof window !== 'undefined' ? window.location.origin : undefined
): string => (origin ? `${origin}${detailPath}` : detailPath);

/** 큰 수를 1.2천 / 3.4만 식으로 축약(메타 배지). 1000 미만은 그대로. */
export const formatCompactCount = (value: number): string => {
  if (!Number.isFinite(value) || value < 0) return '0';
  if (value < 1000) return String(Math.floor(value));
  if (value < 10000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}천`;
  return `${(value / 10000).toFixed(value % 10000 === 0 ? 0 : 1)}만`;
};
