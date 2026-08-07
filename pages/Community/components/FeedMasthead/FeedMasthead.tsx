import type { FeedMastheadProps } from './FeedMasthead.types';
import {
  MastheadAction,
  MastheadBody,
  MastheadEyebrow,
  MastheadLead,
  MastheadRoot,
  MastheadTitle
} from './FeedMasthead.styled';

/**
 * 커뮤니티 목록의 머리 면 — 소제목 / 제목 / 리드 / 주 행동 / 마스코트.
 *
 * 주 행동(글쓰기)이 여기 있는 이유: 앱 헤더에 두면 "무엇을 쓰는지"의 문맥이 없고
 * (2026-07-31 결정), 컨트롤 줄에 두면 정렬·뷰 토글과 폭을 다툰다. 화면의 이름 바로 아래가
 * 그 두 문제를 동시에 푸는 자리다 — 문맥은 제목이 주고, 폭은 머리 면이 통째로 갖는다.
 */
export default function FeedMasthead({
  eyebrow,
  title,
  lead,
  titleAs = 'h1',
  actionLabel,
  actionIcon,
  onAction
}: FeedMastheadProps) {
  return (
    <MastheadRoot>
      <MastheadBody>
        <MastheadEyebrow>{eyebrow}</MastheadEyebrow>
        <MastheadTitle as={titleAs}>{title}</MastheadTitle>
        <MastheadLead>{lead}</MastheadLead>
        {/* 라벨과 핸들러가 **둘 다** 있을 때만 선다 — 한쪽만 준 호출부는 버튼을 얻지 못한다. */}
        {actionLabel && onAction ? (
          <MastheadAction type="button" onClick={onAction}>
            {actionIcon}
            {actionLabel}
          </MastheadAction>
        ) : null}
      </MastheadBody>
    </MastheadRoot>
  );
}
