import { Check } from 'lucide-react';
import type { StatTileProps } from './StatTile.types';
import { clampProgress, formatProgressHint, toProgressPercent } from './StatTile.utils';
import {
  ProgressFill,
  ProgressTrack,
  TileHint,
  TileLabel,
  TileLabelRow,
  TileRoot,
  TileStatusGlyph,
  TileValue
} from './StatTile.styled';

/**
 * 지표 하나(라벨 / 값 / 보조설명 / 선택적 진행률).
 *
 * 접근성: 라벨과 값이 각각 별개의 `<p>`라서 스크린리더가 "최종 자산 가치" "1억 2천만원"을
 * 순서대로 읽는다. 시각적 크기 차이는 읽는 순서를 바꾸지 않는다.
 *
 * 진행률(§4.4): `role="progressbar"` + aria-valuenow에 더해 **문장을 병기**한다
 * ("목표의 72% 도달") — 색(오로라 바)만으로는 아무것도 전달하지 않는다.
 */
export default function StatTile({
  label,
  value,
  hint,
  emphasis = 'default',
  tone = 'neutral',
  action,
  progress,
  progressLabel,
  status,
  statusLabel,
  statusEnter = false
}: StatTileProps) {
  const clamped = progress === undefined ? undefined : clampProgress(progress);

  return (
    <TileRoot emphasis={emphasis} status={status}>
      <TileLabelRow>
        {/*
         * 상태는 **면색·글리프·텍스트 셋으로** 말한다. 글리프에 접근명(`statusLabel`)을 붙여
         * 색과 모션이 유일한 채널이 되지 않게 한다 — reduced-motion·색각 이상에서도 읽힌다.
         */}
        {status ? (
          <TileStatusGlyph $enter={statusEnter} role="img" aria-label={statusLabel}>
            <Check size={14} strokeWidth={1.8} aria-hidden focusable={false} />
          </TileStatusGlyph>
        ) : null}
        <TileLabel emphasis={emphasis}>{label}</TileLabel>
        {action}
      </TileLabelRow>
      <TileValue emphasis={emphasis} tone={tone}>
        {value}
      </TileValue>
      {clamped !== undefined ? (
        <>
          <ProgressTrack
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={toProgressPercent(clamped)}
            aria-label={progressLabel}
          >
            {/* 폭은 연속값이라 클래스가 아니라 style로 — 재계산마다 스타일시트가 불어나지 않게. */}
            <ProgressFill style={{ width: `${toProgressPercent(clamped)}%` }} />
          </ProgressTrack>
          <TileHint emphasis={emphasis}>{formatProgressHint(clamped)}</TileHint>
        </>
      ) : null}
      {hint ? <TileHint emphasis={emphasis}>{hint}</TileHint> : null}
    </TileRoot>
  );
}
