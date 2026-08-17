import { SIMULATOR_PATH } from '@/shared/constants/routes';
import { LANDING_LEVELS } from '../../copy';
import {
  CardName,
  CardOutcome,
  CardStatement,
  DirectLink,
  PickerCard,
  PickerGrid,
  PickerItem,
  PickerRoot
} from './LevelPicker.styled';
import type { LevelPickerProps } from './LevelPicker.types';

/**
 * 랜딩 히어로의 **수준 4갈래**.
 *
 * ## 이 블록이 히어로 CTA 를 대체했다 (2026-08-17 사용자 결정)
 * 전에는 `배당 계산 시작하기`·`보유 종목으로 계산` 두 버튼이 있었다 — 둘 다 **이미 무엇을 할지 아는
 * 사람**용이다. 모르는 방문자는 4천 픽셀짜리 문서를 스스로 훑어 자기 자리를 찾아야 했다.
 *
 * ## 🔴 `Link` 다 (버튼 + navigate 가 아니다)
 * 콜백은 **계측만** 한다. 이동은 `Link` 가 하므로 가운데 클릭·`Cmd+클릭`·"새 탭에서 열기"·주소
 * 미리보기가 전부 살아 있다. `onClick` 에서 `navigate()` 를 부르면 그것들이 조용히 죽는다.
 *
 * ## 🔴 `nav` + `ul` 이다
 * 넷은 **동등한 목적지 목록**이라 화면 낭독기에게도 그렇게 들려야 한다("목록, 항목 4개").
 * `aria-label` 이 없으면 페이지의 다른 내비게이션과 구별되지 않는다.
 *
 * ⚠ 카드 문구·도착지는 `LANDING_LEVELS` 가 소유한다. 여기서 다시 적지 마라 — 두 곳에 적으면 갈린다.
 */
export default function LevelPicker({ onSelectLevel, onDirect }: LevelPickerProps) {
  return (
    <PickerRoot aria-label="수준별 시작하기">
      <PickerGrid>
        {LANDING_LEVELS.map((level) => (
          <PickerItem key={level.id}>
            <PickerCard
              to={level.to}
              /* 접힘 위 프로브가 이 속성으로 요소를 찾는다 — 배열 순서가 바뀌어도 같은 곳을 가리킨다. */
              data-landing-level={level.id}
              onClick={() => onSelectLevel(level.id)}
            >
              <CardName>{level.name}</CardName>
              <CardStatement>{level.statement}</CardStatement>
              <CardOutcome>{level.outcome}</CardOutcome>
            </PickerCard>
          </PickerItem>
        ))}
      </PickerGrid>

      {/* 직행로. 네 갈래를 만들면서 잃은 길을 메운다 — 무게는 한 단 아래다(styled 주석). */}
      {/* 🔴 `data-landing-cta="simulator"` 를 **여기가 이어받는다**. 이 속성은 외부 접힘 프로브
          (headerprobe)의 랜딩 전용 앵커라, 사라지면 그 검사가 "요소 0건"으로 조용히 통과한다.
          히어로 CTA 두 버튼이 걷힌 뒤 시뮬레이터로 가는 접힘 위 링크는 이 하나뿐이다. */}
      <DirectLink to={SIMULATOR_PATH} data-landing-cta="simulator" onClick={onDirect}>
        바로 계산기로 →
      </DirectLink>
    </PickerRoot>
  );
}
