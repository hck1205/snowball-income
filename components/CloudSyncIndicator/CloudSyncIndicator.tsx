import { AlertCircle, Check, CloudOff, GitMerge, HardDrive, RefreshCw } from 'lucide-react';
import { useCloudSyncStateValue } from '@/jotai/snowball/cloud';
import type { CloudSyncIndicatorProps } from './CloudSyncIndicator.types';
import { describeCloudSyncState, type CloudSyncGlyph } from './CloudSyncIndicator.utils';
import {
  BadgeRoot,
  HeaderConflictButton,
  HeaderRoot,
  HeaderText,
  InlineRoot,
  InlineText,
  RetryButton,
  SpinAnim,
  SrOnly
} from './CloudSyncIndicator.styled';

const ICON_SIZE = 16;

/** 형태로 상태를 구분한다(색이 아니라) — 각 glyph는 서로 다른 lucide 아이콘. */
function GlyphIcon({ glyph }: { glyph: CloudSyncGlyph }) {
  const common = { size: ICON_SIZE, strokeWidth: 1.8, 'aria-hidden': true, focusable: false } as const;
  switch (glyph) {
    case 'check':
      return <Check {...common} />;
    case 'spinner':
      return (
        <SpinAnim>
          <RefreshCw {...common} />
        </SpinAnim>
      );
    case 'offline':
      return <CloudOff {...common} />;
    case 'alert':
      return <AlertCircle {...common} />;
    case 'conflict':
      return <GitMerge {...common} />;
    case 'device':
    default:
      return <HardDrive {...common} />;
  }
}

/**
 * 클라우드 저장 상태 표시 (§8.3). 4상태(+idle/offline)를 **아이콘 형태 + 텍스트**로 병기한다 —
 * 색만으로 구분하지 않는다. 상태는 `cloudSyncStateAtom` 단일 소스에서 읽어 버튼 배지와 패널 문장이
 * 항상 같은 상태를 말한다.
 */
export default function CloudSyncIndicator({ variant, onRetry, onResume }: CloudSyncIndicatorProps) {
  const state = useCloudSyncStateValue();
  const desc = describeCloudSyncState(state);

  if (variant === 'badge') {
    // 버튼 모서리 점 — 아이콘 형태가 상태를 나르고, 라벨은 스크린리더용으로 병기(색만 아님).
    return (
      <BadgeRoot tone={desc.tone} aria-hidden={false} role="img" aria-label={`저장 상태: ${desc.shortLabel}`}>
        <GlyphIcon glyph={desc.glyph} />
        <SrOnly>{desc.shortLabel}</SrOnly>
      </BadgeRoot>
    );
  }

  if (variant === 'header') {
    // 충돌(동기화 보류)은 **클릭 가능한 표시**로 띄운다 — 눌러 화해 모달을 다시 연다(이연 후 재개봉).
    // 저장 중/실패의 정적 표시와 달리 사용자의 결정을 이어가야 하므로 버튼이다(무음 화해 금지).
    if (desc.status === 'conflict') {
      return (
        <HeaderConflictButton
          type="button"
          tone={desc.tone}
          onClick={onResume}
          title={desc.sentence}
          aria-label={`${desc.shortLabel} — 눌러서 확인하기`}
        >
          <GlyphIcon glyph={desc.glyph} />
          <HeaderText>{desc.shortLabel}</HeaderText>
        </HeaderConflictButton>
      );
    }
    // 앱 헤더용 컴팩트 표시. **저장 중·저장 실패만** 노출한다 — 평상시(idle/저장됨/오프라인)는
    // 렌더하지 않는다. "저장됨" 체크가 상시 떠 있으면 의미가 모호하다는 사용자 피드백을 반영했다.
    // 실패는 무음 실패 금지 원칙상 반드시 보이며(라벨+재시도), 저장 중은 스피너로 잠깐 스친다.
    if (desc.status !== 'saving' && desc.status !== 'error') return null;
    return (
      <HeaderRoot tone={desc.tone} role="status" aria-live="polite" title={desc.shortLabel}>
        <GlyphIcon glyph={desc.glyph} />
        {desc.canRetry ? <HeaderText>{desc.shortLabel}</HeaderText> : <SrOnly>{desc.shortLabel}</SrOnly>}
        {desc.canRetry && onRetry ? (
          <RetryButton type="button" onClick={onRetry}>
            다시 시도
          </RetryButton>
        ) : null}
      </HeaderRoot>
    );
  }

  return (
    <InlineRoot tone={desc.tone} role="status" aria-live="polite">
      <GlyphIcon glyph={desc.glyph} />
      <InlineText>{desc.sentence}</InlineText>
      {desc.canRetry && onRetry ? (
        <RetryButton type="button" onClick={onRetry}>
          다시 시도
        </RetryButton>
      ) : null}
    </InlineRoot>
  );
}
