import { BrandGlyph } from '@/components/common';
import type { FeedMastheadProps } from './FeedMasthead.types';
import {
  MastheadAction,
  MastheadBody,
  MastheadEyebrow,
  MastheadLead,
  MastheadMark,
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
        <MastheadAction type="button" onClick={onAction}>
          {actionIcon}
          {actionLabel}
        </MastheadAction>
      </MastheadBody>
      <MastheadMark>
        {/* 금화는 네이비 패널 위에서만 켠다(밝은 면 위 금색은 1.83:1). */}
        <BrandGlyph size={96} />
      </MastheadMark>
    </MastheadRoot>
  );
}
