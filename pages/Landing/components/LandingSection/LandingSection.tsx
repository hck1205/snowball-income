import type { LandingSectionProps } from './LandingSection.types';
import {
  SectionAside,
  SectionBadge,
  SectionBody,
  SectionLede,
  SectionMark,
  SectionOrdinal,
  SectionRoot,
  SectionTitle
} from './LandingSection.styled';

/**
 * 랜딩 한 장(章)의 껍데기 — **번호 기둥 + 본문 밭**.
 *
 * ## 2026-08-03 2차 리워크: 세로 스택 → 2열 스파인
 * before 는 여섯 장이 전부 `[36px 배지 + 18px 제목] → 전폭 본문` 이었다. 제목이 카드 제목(16px)과
 * 두 단계밖에 안 벌어져 **장과 카드가 같은 무게로** 읽혔고, 1160px 본문에 산문·표·격자가 전부
 * 같은 폭으로 서서 위에서 아래까지 리듬이 한 종류였다(실측 @1280: 블록 사이 간격이 여덟 곳 전부 동일).
 *
 * 지금은 ≥`layout`(981px) 에서 **왼쪽 기둥**(장 번호 · 배지 · 제목)과 **오른쪽 밭**(리드 + 본문)로
 * 갈린다. 기둥은 `position: sticky` 라 긴 장을 읽는 동안 "지금 몇 장인가"가 화면에 남는다.
 * 좁은 폭에서는 한 열로 접히고 순서(번호 → 제목 → 리드 → 본문)는 그대로다.
 *
 * 🔴 **S2(주요 지수)에는 쓰지 않는다.** `MarketIndexStrip` 이 자기 `<section>` 과 `<h2>` 를 이미
 * 갖고 있어 여기에 한 번 더 감싸면 랜드마크와 제목이 이중이 된다.
 *
 * 헤딩 레벨은 `h2` 로 고정이다 — 문서의 유일한 `h1` 은 히어로 제목이고, 섹션 안의 소제목은 `h3` 다.
 * 레벨을 건너뛰지 않는다.
 *
 * ⚠ 번호(`SectionOrdinal`)는 `aria-hidden` 이다. 문서 순서가 이미 순서를 말하므로 스크린리더가
 * "영일, 배당을 알기 전에…"로 두 번 읽으면 안 된다. 차례 링크도 같은 이유로 번호를 감춘다.
 */
export default function LandingSection({
  id,
  anchorId,
  ordinal,
  title,
  icon,
  tone,
  emphasis,
  lede,
  children
}: LandingSectionProps) {
  return (
    <SectionRoot id={anchorId} aria-labelledby={id} $emphasis={emphasis}>
      <SectionAside>
        <SectionMark>
          <SectionOrdinal aria-hidden>{ordinal}</SectionOrdinal>
          <SectionBadge $tone={tone} aria-hidden>
            {icon}
          </SectionBadge>
        </SectionMark>
        <SectionTitle id={id}>{title}</SectionTitle>
      </SectionAside>

      <SectionBody>
        {lede ? <SectionLede>{lede}</SectionLede> : null}
        {children}
      </SectionBody>
    </SectionRoot>
  );
}
