import type { PageHeroProps } from './PageHero.types';
import {
  HeroActions,
  HeroIconBadge,
  HeroLede,
  HeroMeta,
  HeroRoot,
  HeroTitle,
  HeroTitleAction,
  HeroTitleGroup,
  HeroTitleRow
} from './PageHero.styled';

/**
 * 페이지 히어로 — 아이콘 · 제목 · 리드 · 근거(meta) · 액션.
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
  meta,
  actions,
  titleAction,
  tone = 'gradient'
}: PageHeroProps) {
  return (
    <HeroRoot $tone={tone}>
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
      {meta ? <HeroMeta>{meta}</HeroMeta> : null}
    </HeroRoot>
  );
}
