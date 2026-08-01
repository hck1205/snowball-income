import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  PORTFOLIO_PRESET_GROUPS,
  PORTFOLIO_PRESET_PLACEHOLDERS,
  buildPresetMetrics,
  groupPortfolioPresets,
  type PortfolioPresetPlaceholder
} from '@/pages/Main/components/MainRightPanel/components';

/**
 * 🔴 **프리셋 성향 묶음은 데이터에서 파생된다.**
 *
 * 13지선다를 4묶음으로 접은 화면은, 묶음 목록을 컴포넌트에 배열로 적어 두면 프리셋을 하나 추가할 때마다
 * 두 곳이 어긋난다 — 그리고 **어긋난 쪽은 화면에서 조용히 사라진다**(카드가 그냥 안 그려진다).
 * 그래서 유일한 출처는 각 프리셋의 `group` 필드이고, 화면은 `groupPortfolioPresets` 로만 만든다.
 *
 * 지표 계약도 함께 잠근다: 카드가 보여 주는 숫자는 **2개**다. 예전의 4행 스펙표로 되돌아가면
 * 13장이 다시 전부 같은 모양이 된다(리워크 이전 상태).
 */

const componentSource = (name: string): string => {
  const raw = readFileSync(
    resolve(
      process.cwd(),
      'pages/Main/components/MainRightPanel/components/PortfolioPresetBoard',
      name
    ),
    'utf8'
  );
  // 이 레포는 주석이 길어서 소스 스캔이 서술적 주석에 그대로 매치된다 — 반드시 걷어내고 본다.
  return raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
};

describe('프리셋 성향 묶음 — 데이터에서 파생된다', () => {
  it('모든 프리셋이 정확히 한 묶음에 들어가고, 하나도 사라지지 않는다', () => {
    const sections = groupPortfolioPresets();
    const placed = sections.flatMap((section) => [...section.visible, ...section.hidden]);

    expect(placed).toHaveLength(PORTFOLIO_PRESET_PLACEHOLDERS.length);
    expect(new Set(placed.map((preset) => preset.id)).size).toBe(PORTFOLIO_PRESET_PLACEHOLDERS.length);
  });

  it('묶음 순서·라벨은 레지스트리가 정한다', () => {
    expect(groupPortfolioPresets().map((section) => section.group.id)).toEqual(
      PORTFOLIO_PRESET_GROUPS.map((group) => group.id)
    );
  });

  it('프리셋을 새로 추가하면 화면이 자동으로 따라온다 — 목록을 어디에도 다시 적지 않는다', () => {
    // `PortfolioPresetPlaceholder` 는 `as const` 배열에서 파생된 **닫힌 리터럴 유니온**이라,
    // "아직 없는 프리셋"은 정의상 그 유니온 밖이다 — 합성 값에는 캐스팅이 정직한 표현이다.
    const newcomer = {
      ...PORTFOLIO_PRESET_PLACEHOLDERS[0],
      id: 'brand-new',
      group: 'income' as const
    } as unknown as PortfolioPresetPlaceholder;
    const sections = groupPortfolioPresets(2, [...PORTFOLIO_PRESET_PLACEHOLDERS, newcomer]);
    const income = sections.find((section) => section.group.id === 'income');

    expect([...(income?.visible ?? []), ...(income?.hidden ?? [])].map((preset) => preset.id)).toContain(
      'brand-new'
    );
  });

  it('처음 펼치는 장수는 인자가 정한다 — 0이면 이름만 서고 카드는 "더 보기"가 연다', () => {
    const collapsed = groupPortfolioPresets(0);

    expect(collapsed.every((section) => section.visible.length === 0)).toBe(true);
    expect(collapsed.flatMap((section) => section.hidden)).toHaveLength(PORTFOLIO_PRESET_PLACEHOLDERS.length);
  });

  it('알 수 없는 묶음의 프리셋도 화면에서 증발하지 않는다(마지막 묶음이 받는다)', () => {
    const orphan = { ...PORTFOLIO_PRESET_PLACEHOLDERS[0], id: 'orphan', group: 'nope' } as never;
    const sections = groupPortfolioPresets(2, [orphan]);
    const placed = sections.flatMap((section) => [...section.visible, ...section.hidden]);

    expect(placed.map((preset) => preset.id)).toEqual(['orphan']);
  });

  it('카드가 보여 주는 지표는 2개뿐이다 — 4행 스펙표로 되돌아가지 않는다', () => {
    const metrics = buildPresetMetrics(PORTFOLIO_PRESET_PLACEHOLDERS[0]);

    expect(metrics.map((metric) => metric.label)).toEqual(['목표 월배당', '투자 기간']);
  });

  it('컴포넌트가 프리셋·묶음 id 를 직접 나열하지 않는다', () => {
    const source = componentSource('PortfolioPresetBoard.tsx');
    const hardcodedIds = PORTFOLIO_PRESET_PLACEHOLDERS.map((preset) => preset.id).filter((id) =>
      source.includes(`'${id}'`)
    );
    const hardcodedGroups = PORTFOLIO_PRESET_GROUPS.map((group) => group.id).filter((id) =>
      source.includes(`'${id}'`)
    );

    expect([...hardcodedIds, ...hardcodedGroups]).toEqual([]);
  });
});
