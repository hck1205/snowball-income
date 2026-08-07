import { Check } from 'lucide-react';
import { OverflowTooltip } from '@/components/common';
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
      {/*
        🔴 값·보조설명은 `nowrap + ellipsis` 라 좁은 타일에서 자주 잘린다. 잘린 글자를 되찾을 길이
        있어야 한다(2026-08-07 사용자 지시) — `OverflowTooltip` 은 **실제로 잘렸을 때만** 뜨고
        hover·클릭·키보드를 모두 받는다(모바일에는 호버가 없으므로 클릭이 유일한 길이다).
        ⚠ 문자열일 때만 감싼다. 툴팁은 전체 문자열을 알아야 하는데 ReactNode 는 글자로 환원되지
          않는다 — 노드를 넘긴 호출부는 자기 안에서 잘림을 다뤄야 한다.
        ⚠ 폭 계약: 이 두 요소는 타일 폭 100% 를 쓰는 블록이고 툴팁 앵커는 `max-width: 100%` 라,
          감싸도 상자 폭이 그대로다(감쌈↔풂이 반복되지 않는다 — OverflowTooltip 머리말의 계약).
      */}
      {typeof value === 'string' ? (
        <OverflowTooltip text={value}>
          <TileValue emphasis={emphasis} tone={tone} />
        </OverflowTooltip>
      ) : (
        <TileValue emphasis={emphasis} tone={tone}>
          {value}
        </TileValue>
      )}
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
      {typeof hint === 'string' ? (
        <OverflowTooltip text={hint}>
          <TileHint emphasis={emphasis} />
        </OverflowTooltip>
      ) : hint ? (
        <TileHint emphasis={emphasis}>{hint}</TileHint>
      ) : null}
    </TileRoot>
  );
}
