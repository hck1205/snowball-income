import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { LANDING_COPY } from '../../copy';
import type { ChapterIndexProps } from './ChapterIndex.types';
import {
  IndexEyebrow,
  IndexItem,
  IndexLabel,
  IndexLink,
  IndexList,
  IndexOrdinal,
  IndexRoot
} from './ChapterIndex.styled';

const copy = LANDING_COPY.chapterIndex;

/**
 * 히어로 아래 **차례**(2026-08-03 2차 리워크에서 신설).
 *
 * ## 왜 만들었나
 * 이 지면은 실측 4136px(@1280) 짜리 안내서인데 **문서 지도가 없었다.** SNS 로 들어온 방문자가
 * 3초 안에 얻을 수 있는 정보는 히어로 한 줄뿐이었고, "여기서 무엇을 알 수 있는가"는 여섯 번
 * 스크롤해야 나왔다. 여섯 줄짜리 차례가 그것을 첫 화면 근처에서 통째로 말한다.
 *
 * ## 규율
 * - 🔴 **평범한 앵커다.** `scrollIntoView` 를 손으로 부르지 않는다 — 브라우저의 기본 동작이
 *   `prefers-reduced-motion` 과 헤더 오프셋(`scroll-margin-top`)을 이미 옳게 처리한다.
 *   JS 스크롤을 넣는 순간 그 둘을 우리가 지켜야 하고, 지키지 않아도 아무도 신고하지 않는다.
 * - 🔴 **번호는 `aria-hidden`** 이다. 링크의 접근명은 라벨 하나여야 한다("영일 주식 ETF 배당주"가
 *   아니라 "주식 · ETF · 배당주").
 * - 🔴 `data-landing-cta` 를 붙이지 마라 — 그 속성은 접힘 위 히어로 CTA 프로브 전용이고
 *   정확히 2개임이 테스트로 잠겨 있다.
 * - 계측 이름은 장 키를 담는다(`landing_index_<key>`) — 어느 장이 궁금해서 눌렀는지가 데이터다.
 */
export default function ChapterIndex({ chapters }: ChapterIndexProps) {
  return (
    <IndexRoot aria-label={copy.navLabel}>
      <IndexEyebrow>{copy.eyebrow}</IndexEyebrow>
      <IndexList>
        {chapters.map((chapter) => (
          <IndexItem key={chapter.key}>
            <IndexLink
              href={`#${chapter.anchorId}`}
              onClick={() =>
                trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: `landing_index_${chapter.key}` })
              }
            >
              <IndexOrdinal aria-hidden>{chapter.ordinal}</IndexOrdinal>
              <IndexLabel>{chapter.label}</IndexLabel>
            </IndexLink>
          </IndexItem>
        ))}
      </IndexList>
    </IndexRoot>
  );
}
