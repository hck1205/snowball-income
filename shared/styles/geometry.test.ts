// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { DATA_RADIUS, DATA_SURFACE, PICK, PICK_RADIUS, brandPanel, cardElevation, colorCap } from './index';

/**
 * **면의 종류(SurfaceKind) 기하 계약.**
 *
 * 이 파일이 지키는 것은 셋이다.
 *  1. brand 면과 data 면의 패딩 대역이 **두 곳에 적혀 갈리지 않는가**(공용 Card 와 토큰).
 *  2. 레일 캡이 `tintscan` 의 면 하한(높이 8px) **아래**에 남아 있는가 — 여기가 예산의 생사다.
 *  3. 금색이 `brandPanel()` 밖으로 새지 않는가.
 */
const REPO_ROOT = resolve(__dirname, '../..');

const read = (path: string): string => readFileSync(join(REPO_ROOT, path), 'utf-8');

/** `clamp(a, b, c)` 의 하한·상한을 px 숫자로 뽑는다. */
const clampBounds = (value: string): { min: number; max: number } => {
  const match = value.match(/clamp\(\s*([\d.]+)px\s*,[^,]+,\s*([\d.]+)px\s*\)/);
  expect(match, `clamp 형태가 아니다: ${value}`).not.toBeNull();
  return { min: Number(match?.[1]), max: Number(match?.[2]) };
};

describe('brand 면 / data 면의 패딩 대역', () => {
  /**
   * 🔴 공용 `Card` 는 자기 패딩을 자기 파일에서 단일 원천으로 갖는다(그 소유권을 빼앗지 않았다).
   * 대신 두 값이 갈리는 순간을 여기서 잡는다 — 갈리면 같은 격자에 두 종류 카드가 섞였을 때
   * 줄 높이가 어긋난다.
   */
  it('DATA_SURFACE.pad 는 공용 Card 의 패딩과 같은 값이다', () => {
    const cardSource = read('components/common/Card/Card.styled.ts');

    expect(
      cardSource,
      `공용 Card 의 CARD_PADDING 이 바뀌었다면 DATA_SURFACE.pad(${DATA_SURFACE.pad})도 함께 고쳐라`
    ).toContain(`const CARD_PADDING = '${DATA_SURFACE.pad}'`);
  });

  it('고르는 면은 읽는 면보다 좁게 조인다 (캡이 세로를 먹기 때문)', () => {
    const pick = clampBounds(PICK.pad);
    const data = clampBounds(DATA_SURFACE.pad);

    expect(pick.min).toBeLessThan(data.min);
    expect(pick.max).toBeLessThan(data.max);
    // 그렇다고 다른 조로 보일 만큼 벌리지는 않는다.
    expect(data.min - pick.min).toBeLessThanOrEqual(4);
  });

  it('두 면의 반경은 각자의 안쪽 컨트롤 + 패딩에서 파생된다', () => {
    expect(PICK_RADIUS).toBe(`calc(${PICK.radiusAnchor} + ${PICK.pad})`);
    expect(DATA_RADIUS).toBe(`calc(${DATA_SURFACE.radiusAnchor} + ${DATA_SURFACE.pad})`);
    // brand 면이 더 둥글다 — 같은 화면에 섞였을 때 반경이 신호를 거든다.
    expect(Number(PICK.radiusAnchor.replace('px', ''))).toBeGreaterThan(
      Number(DATA_SURFACE.radiusAnchor.replace('px', ''))
    );
  });

  it('카드 간격이 부상 그림자 blur(12px)보다 좁지 않다', () => {
    expect(clampBounds(PICK.gap).min).toBeGreaterThanOrEqual(12);
  });
});

describe('컬러 캡 — tintscan 의 면 하한(8px)을 넘지 않는다', () => {
  /**
   * 🔴 이 한 줄이 예산의 생사다. 6 → 8 로 올리는 순간 레일은 "선"에서 "면"이 되어
   * 그 라우트의 틴트 면 예산(화면당 2)을 먹는다. 올리지 마라.
   */
  it('레일 캡은 6px 이다 (8px 이 되면 면으로 세어진다)', () => {
    expect(Number(PICK.railHeight.replace('px', ''))).toBeLessThan(8);
  });

  it('틴트 캡 3단은 모두 면으로 세어지는 높이다 (그래서 클러스터 옵트인이 필수다)', () => {
    for (const height of Object.values(PICK.capHeight)) {
      expect(Number(height.replace('px', ''))).toBeGreaterThanOrEqual(8);
    }
  });

  it('글리프 배지는 폭 하한(180px) 아래라 그 자체로는 면이 아니다', () => {
    expect(Number(PICK.glyphSize.replace('px', ''))).toBeLessThan(180);
  });

  it('캡은 3변으로 bleed 하고 위쪽 두 모서리만 부모 반경을 따른다', () => {
    const css = colorCap('30px', '16px');

    expect(css).toContain('margin: calc(-1 * 16px) calc(-1 * 16px) 16px;');
    expect(css).toContain('border-radius: calc(30px - 1px) calc(30px - 1px) 0 0;');
  });
});

describe('pick 면의 위계 — 층마다 수단은 하나다', () => {
  it('평상시에는 테두리로만 뜬다 (그림자와 동시에 선언하지 않는다)', () => {
    const css = cardElevation('pick');

    expect(css).toContain('border: 1px solid');
    expect(css).toContain('box-shadow: none');
  });

  /** e1(1px/0.05)은 흰 배경에서 보이지 않는다 — 테두리 없는 e1 카드는 base 보다 약해진다. */
  it('부상은 e1 이 아니라 e2 로 한다', () => {
    expect(cardElevation('pick')).not.toContain('--sb-shadow-1');
  });
});

describe('brandPanel — 금색이 사는 유일한 자리', () => {
  it('패널 면과 그 위 글자색을 함께 낸다', () => {
    const css = brandPanel();

    expect(css).toContain('--sb-panel');
    expect(css).toContain('--sb-on-panel)');
  });

  /** 라이트에서 panel/bg 는 8프리셋 최저 12.4:1 — 경계가 필요 없다. */
  it('다크에서만 금색 헤어라인을 그린다', () => {
    const css = brandPanel();

    expect(css).toContain("prefers-color-scheme: dark");
    expect(css).toContain('--sb-on-panel-gold');
    expect(css).toContain("data-theme='light'");
  });

  /**
   * 🔴 금색은 이 믹스인이 깐 면 위에서만 합법이다(밝은 면 위 1.83:1). 범용 gold 토큰은
   * 일부러 없으므로, 새는 경로는 `color.onPanelGold` 직접 참조뿐이다.
   */
  it('공용 부품 중 금색을 직접 참조하는 곳은 없다', () => {
    const pickCard = read('components/common/PickCard/PickCard.styled.ts');

    expect(pickCard).not.toContain('onPanelGold');
  });
});
