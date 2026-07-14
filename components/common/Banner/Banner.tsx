import type { BannerProps } from './Banner.types';
import { BannerBody, BannerContent, BannerDismiss, BannerRoot, BannerTitle } from './Banner.styled';

/**
 * 공지 / 경고 / 에러 배너.
 *
 * `role`이 기본 `status`인 이유: 대부분의 배너는 "알아두면 좋은 것"이지 "지금 멈춰야 하는 것"이 아니다.
 * `alert`는 스크린리더가 하던 말을 끊고 끼어들기 때문에 진짜 에러에만 쓴다.
 */
export default function Banner({
  tone = 'info',
  title,
  children,
  onDismiss,
  dismissAriaLabel,
  role = 'status',
  'aria-label': ariaLabel
}: BannerProps) {
  return (
    <BannerRoot tone={tone} role={role} aria-label={ariaLabel}>
      <BannerContent>
        {title ? <BannerTitle>{title}</BannerTitle> : null}
        <BannerBody>{children}</BannerBody>
      </BannerContent>
      {onDismiss ? (
        <BannerDismiss tone={tone} type="button" aria-label={dismissAriaLabel ?? '닫기'} onClick={onDismiss}>
          ×
        </BannerDismiss>
      ) : null}
    </BannerRoot>
  );
}
