import { memo } from 'react';
import { DisclaimerFooter, DisclaimerText } from './LandingDisclaimer.styled';

/**
 * 랜딩 하단에 **항상 보이는**(접힘·닫기 없음) 짧은 고지. URL 만 방문한 리뷰어·사용자가
 * 곧바로 "콘텐츠 유형(무료 계산기)·비자문(참고용)·비영리(무광고)"를 알 수 있게 한다.
 *
 * 기존 `ModelChangeNotice`(임시 배너·기본 접힘·닫으면 영구 소멸)와 목적이 다르다 — 이쪽은
 * 상호작용 없이 상시 노출되는 정적 텍스트라 스크린리더에도 그대로 읽힌다(aria-hidden 금지).
 *
 * `MarketDataAsOf` 도 `<footer>` 라 랜드마크가 겹치므로 `aria-label` 로 구분해 둔다.
 */
function LandingDisclaimerComponent() {
  return (
    <DisclaimerFooter aria-label="사이트 고지">
      <DisclaimerText>
        무료 배당 재투자 시뮬레이션 계산기입니다. 입력한 가정을 계산해 보여줄 뿐, 투자 자문이 아니며 참고용입니다.
        비영리 개인 프로젝트로 유료 기능·광고가 없습니다.
      </DisclaimerText>
    </DisclaimerFooter>
  );
}

const LandingDisclaimer = memo(LandingDisclaimerComponent);

export default LandingDisclaimer;
