import type { PageHeroProps } from './PageHero.types';
import {
  HeroActions,
  HeroIconBadge,
  HeroLede,
  HeroMascot,
  HeroMeta,
  HeroNotice,
  HeroRoot,
  HeroTitle,
  HeroTitleAction,
  HeroTitleGroup,
  HeroTitleRow
} from './PageHero.styled';

/**
 * 페이지 히어로 — 아이콘 · 제목 · 리드 · 고지(notice) · 근거(meta) · 액션.
 *
 * **앱의 유일한 히어로다**(2026-07-31 수렴 — 포트폴리오·캘린더의 로컬 복제 2벌을 흡수했다).
 * 페이지별 차이는 슬롯 prop 으로만 들어온다. 색은 라우트가 발행하는 `--sb-page-hue` 를 스타일이
 * 직접 읽으므로 **여기에 색 prop 은 없다**(발행처가 둘이면 히어로와 상단 내비가 어긋난다 —
 * `shared/hooks/usePageHue` 주석 참고).
 *
 * `titleAs` 기본값이 `'h2'` 인 이유: 이 앱의 `h1` 은 헤더 워드마크가 갖는다(확정 결정).
 * 워드마크가 `h1` 이 아닌 페이지에서만 `'h1'` 로 올린다.
 *
 * 숫자 슬롯(`stat`)은 **일부러 없다** — 히어로 숫자는 요약 카드가 소유한다.
 */
export default function PageHero({
  icon,
  title,
  titleAs = 'h2',
  lede,
  notice,
  meta,
  actions,
  titleAction,
  tone = 'gradient',
  mascot,
  mascotSize = 'md'
}: PageHeroProps) {
  return (
    <HeroRoot $tone={tone} $mascotSize={mascot ? mascotSize : undefined}>
      <HeroTitleRow>
        <HeroTitleGroup>
          {icon ? <HeroIconBadge aria-hidden>{icon}</HeroIconBadge> : null}
          <HeroTitle as={titleAs}>{title}</HeroTitle>
        </HeroTitleGroup>
        {actions ? <HeroActions>{actions}</HeroActions> : null}
        {/* `actions` **뒤**에 온다 — 넓은 화면에서 주 CTA 오른쪽에 서야 한다.
            좁은 폭에서는 `actions` 가 아래로 내려가는데, 이 슬롯만 제목 줄 오른쪽에 남는다
            (`HeroTitleAction` 의 absolute 분기). */}
        {titleAction ? <HeroTitleAction>{titleAction}</HeroTitleAction> : null}
      </HeroTitleRow>
      {lede ? <HeroLede>{lede}</HeroLede> : null}
      {notice ? <HeroNotice role="note">{notice}</HeroNotice> : null}
      {meta ? <HeroMeta>{meta}</HeroMeta> : null}

      {/* 마스코트 — 장식이라 이름을 갖지 않는다(`alt=""`). 자리·크기·좁은 폭 규칙은 HeroMascot 소유.
          ⚠ 히어로는 접힘 위지만 이 그림은 **본문이 아니다** — lazy 로 두어 첫 페인트를 양보한다. */}
      {mascot ? (
        <HeroMascot $size={mascotSize} src={mascot} alt="" loading="lazy" decoding="async" draggable={false} />
      ) : null}
    </HeroRoot>
  );
}
