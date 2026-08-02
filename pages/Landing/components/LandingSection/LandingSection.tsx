import type { LandingSectionProps } from './LandingSection.types';
import { SectionBadge, SectionHead, SectionLede, SectionRoot, SectionTitle } from './LandingSection.styled';

/**
 * 랜딩 섹션 하나의 껍데기 — `<section aria-labelledby>` + 배지 + `<h2>` + (선택) 리드.
 *
 * 🔴 **S2(주요 지수)에는 쓰지 않는다.** `MarketIndexStrip` 이 자기 `<section>` 과 `<h2>` 를 이미
 * 갖고 있어 여기에 한 번 더 감싸면 랜드마크와 제목이 이중이 된다.
 *
 * 헤딩 레벨은 `h2` 로 고정이다 — 문서의 유일한 `h1` 은 히어로 제목이고, 섹션 안의 소제목은 `h3` 다.
 * 레벨을 건너뛰지 않는다.
 */
export default function LandingSection({
  id,
  title,
  icon,
  tone,
  emphasis,
  lede,
  children
}: LandingSectionProps) {
  return (
    <SectionRoot aria-labelledby={id}>
      <SectionHead $emphasis={emphasis}>
        <SectionBadge $tone={tone} aria-hidden>
          {icon}
        </SectionBadge>
        <SectionTitle id={id}>{title}</SectionTitle>
      </SectionHead>
      {lede ? <SectionLede>{lede}</SectionLede> : null}
      {children}
    </SectionRoot>
  );
}
