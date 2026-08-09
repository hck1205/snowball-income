/**
 * 지표별 **기준선** — 설명에서 말한 숫자를 그래프에도 긋는다.
 *
 * ## 🔴 왜 한 곳에 모으나 (2026-08-09 사용자 지적)
 *
 * 설명 아코디언은 "20 언저리가 오랜 평균이고 30을 넘는 구간은 큰 하락장마다 나타났다"고 말하는데
 * 그래프에는 그 선이 없었다. **글로 말한 숫자가 그림에 없으면 읽는 사람이 눈으로 대조할 수 없다.**
 *
 * 그리고 이 숫자들은 이미 `zones.ts` 가 구간 판정에 쓰고 있다. 그래프가 자기 숫자를 따로 들면
 * 배지는 "긴장"이라 하는데 선은 다른 자리에 그어지는 일이 생긴다 — **한 화면 안에서 두 말이
 * 갈리는 것**이 이 파일이 막는 결함이다.
 *
 * ⚠ 여기 없는 지표는 기준선을 안 그린다. 관습적 경계가 없는 지표에 선을 그으면 그 선이 근거처럼
 *   보인다 — 지어낸 기준을 그림으로 만들어 주는 셈이다.
 */
export type PulseThreshold = {
  value: number;
  /** 선 옆에 붙는 이름. 숫자는 화면이 값에서 뽑으므로 여기엔 **뜻**만 적는다. */
  name: string;
  /** 이 선이 그 지표의 '중심'인가. 하나만 굵게 그린다. */
  primary?: boolean;
};

export const PULSE_THRESHOLDS: Record<string, PulseThreshold[]> = {
  /* 근거는 zones.ts `vixZone` 주석 — 20은 장기 평균 근처, 30은 급락장마다 넘긴 선. */
  vix: [
    { value: 12, name: '조용함' },
    { value: 20, name: '장기 평균', primary: true },
    { value: 30, name: '급락장 구간' }
  ],
  /* 1.0 = 콘탱고↔백워데이션 경계. 이 지표에서 유일하게 뜻이 있는 숫자다. */
  'vix-term': [{ value: 1, name: '단기·장기 역전선', primary: true }],
  /* 🔴 금리차의 0은 경계가 아니라 **사건**이다 — 아래로 내려가면 역전이다. */
  'curve-10y2y': [{ value: 0, name: '역전선', primary: true }],
  'curve-10y3m': [{ value: 0, name: '역전선', primary: true }]
};

/**
 * **이름 붙은 구간 위의 한 점** — 이 화면 지표 다수가 그 모양이다(2026-08-09 사용자 지적).
 *
 * 공포탐욕지수를 CNN 처럼 다이얼로 그리고 나니, VIX 도 기간구조도 금리차도 **같은 구조**라는 게
 * 드러났다: 값 하나가 있고, 그 값이 어느 이름의 구간에 있는지가 읽을거리다. 그래서 셋 다
 * 같은 **가로 밴드 스케일**로 그린다 — 시계열만 보면 "지금 이게 높은 건가"를 매번 계산해야 한다.
 *
 * ⚠ **관습적 경계가 있는 지표만** 여기 넣는다. 하이일드 스프레드·10년물처럼 확립된 경계가 없는
 *   것에 구간을 그리면 지어낸 기준이 그림이 되어 근거처럼 보인다 — 그것들은 시계열과 평균선만
 *   그리고, 구간 판정은 자기 10년 분포(백분위)에 맡긴다.
 * ⚠ 경계값은 `zones.ts` 의 판정 함수와 **같은 숫자**여야 한다.
 */
export type PulseBand = {
  /** 이 구간의 상한(미만). 마지막 구간은 `Infinity`. */
  upTo: number;
  name: string;
  /** 긴장도 — 색은 화면이 이 값으로 고른다(토큰만 쓴다). */
  tone: 'calm' | 'normal' | 'elevated' | 'stressed';
};

export type PulseScale = {
  /** 스케일이 그리는 범위. 실제 값이 벗어나면 화면이 양끝으로 붙인다. */
  min: number;
  max: number;
  bands: PulseBand[];
};

export const PULSE_SCALES: Record<string, PulseScale> = {
  vix: {
    min: 8,
    max: 40,
    bands: [
      { upTo: 12, name: '안정', tone: 'calm' },
      { upTo: 20, name: '보통', tone: 'normal' },
      { upTo: 30, name: '주의', tone: 'elevated' },
      { upTo: Infinity, name: '경계', tone: 'stressed' }
    ]
  },
  'vix-term': {
    min: 0.6,
    max: 1.3,
    bands: [
      { upTo: 0.85, name: '안정', tone: 'calm' },
      { upTo: 1, name: '보통', tone: 'normal' },
      { upTo: 1.1, name: '주의', tone: 'elevated' },
      { upTo: Infinity, name: '경계', tone: 'stressed' }
    ]
  },
  'curve-10y2y': {
    min: -1.5,
    max: 3,
    /* ⚠ 금리차는 **낮을수록 긴장**이라 순서가 반대다 — 역전(음수)이 경계다. */
    bands: [
      { upTo: 0, name: '경계', tone: 'stressed' },
      { upTo: 0.25, name: '주의', tone: 'elevated' },
      { upTo: 1.5, name: '보통', tone: 'normal' },
      { upTo: Infinity, name: '안정', tone: 'calm' }
    ]
  },
  'curve-10y3m': {
    min: -1.5,
    max: 3,
    bands: [
      { upTo: 0, name: '경계', tone: 'stressed' },
      { upTo: 0.25, name: '주의', tone: 'elevated' },
      { upTo: 1.5, name: '보통', tone: 'normal' },
      { upTo: Infinity, name: '안정', tone: 'calm' }
    ]
  }
};

/** 스케일 위에서의 위치(0~1). 범위를 벗어난 값은 양끝에 붙는다 — 마커가 상자 밖으로 나가지 않게. */
export const scalePositionOf = (scale: PulseScale, value: number): number => {
  const ratio = (value - scale.min) / (scale.max - scale.min);
  return Math.min(1, Math.max(0, ratio));
};

/** 각 구간이 스케일에서 차지하는 폭(0~1). 마지막 구간은 남은 폭을 전부 가져간다. */
export const bandWidthsOf = (scale: PulseScale): number[] => {
  let previous = scale.min;
  return scale.bands.map((band, index) => {
    const upper = index === scale.bands.length - 1 ? scale.max : Math.min(band.upTo, scale.max);
    const width = Math.max(0, (upper - previous) / (scale.max - scale.min));
    previous = upper;
    return width;
  });
};

/** 값이 속한 구간. 없으면 `null`(스케일이 정의되지 않은 지표). */
export const bandOf = (indicatorId: string, value: number): PulseBand | null => {
  const scale = PULSE_SCALES[indicatorId];
  if (!scale) return null;
  return scale.bands.find((band) => value < band.upTo) ?? scale.bands[scale.bands.length - 1];
};

/**
 * 값이 기준선의 위인지 아래인지 — 카드가 **글자로** 말하는 데 쓴다.
 *
 * 🔴 색만으로 말하지 않기 위해 존재하는 함수다. 선 위/아래는 이 화면에서 가장 자주 읽는 사실이고,
 *    색각 이상이 있는 사용자에게 색은 채널이 되지 못한다.
 */
export const describeAgainstThreshold = (
  indicatorId: string,
  value: number,
  unit: string,
  precision: number
): string | null => {
  const primary = PULSE_THRESHOLDS[indicatorId]?.find((threshold) => threshold.primary);
  if (!primary) return null;

  const mark = `${primary.value.toLocaleString('ko-KR', { maximumFractionDigits: precision })}${unit}`;
  return value >= primary.value ? `${primary.name} ${mark} 위` : `${primary.name} ${mark} 아래`;
};
