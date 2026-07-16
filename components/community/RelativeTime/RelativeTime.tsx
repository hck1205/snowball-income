import { formatAbsoluteTime, formatRelativeTime } from '@/shared/lib/community';

export type RelativeTimeProps = {
  iso: string;
  className?: string;
};

/**
 * 상대시간을 `<time>`으로 렌더한다. 화면엔 "3일 전", `datetime`엔 ISO, `title`엔 절대시간.
 * 기계/스크린리더가 정확한 값을 얻게 한다.
 */
export default function RelativeTime({ iso, className }: RelativeTimeProps) {
  const relative = formatRelativeTime(iso);
  return (
    <time className={className} dateTime={iso} title={formatAbsoluteTime(iso)}>
      {relative || formatAbsoluteTime(iso)}
    </time>
  );
}
