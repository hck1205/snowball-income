import type { StatTileProps } from './StatTile.types';
import { TileHint, TileLabel, TileLabelRow, TileRoot, TileValue } from './StatTile.styled';

/**
 * 지표 하나(라벨 / 값 / 보조설명).
 *
 * 접근성: 라벨과 값이 각각 별개의 `<p>`라서 스크린리더가 "최종 자산 가치" "1억 2천만원"을
 * 순서대로 읽는다. 시각적 크기 차이는 읽는 순서를 바꾸지 않는다.
 */
export default function StatTile({ label, value, hint, emphasis = 'default', tone = 'neutral', action }: StatTileProps) {
  return (
    <TileRoot emphasis={emphasis}>
      <TileLabelRow>
        <TileLabel emphasis={emphasis}>{label}</TileLabel>
        {action}
      </TileLabelRow>
      <TileValue emphasis={emphasis} tone={tone}>
        {value}
      </TileValue>
      {hint ? <TileHint>{hint}</TileHint> : null}
    </TileRoot>
  );
}
