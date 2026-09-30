/**
 * 보유 종목을 모으는 ETF 명단.
 *
 * 🔴 **전체(약 4,000개)를 모으지 않는다** — 처음에는 많이 찾는 ETF 부터(2026-09-29 결정: 인기 100~200개로
 * 시작하고 수요를 본 뒤 넓힌다). 검색 목록에는 전체가 나오고, 명단 밖 ETF 는 "아직 준비되지 않음"으로 말한다.
 * 금·원자재·코인 ETF(GLD·IBIT 등)는 N-PORT 를 내지 않아 넣어도 모을 수 없다 — 넣지 않는다.
 *
 * 명단에 한 줄을 더하면 다음 갱신에서 모인다(티커만 적으면 된다 — 시리즈는 SEC 표에서 찾는다).
 */

/** 처음 화면에 보여 줄 인기 ETF. 순서가 곧 노출 순서다. 배당 시뮬레이터 사용자가 먼저 찾는 것부터. */
export const POPULAR_ETFS: readonly string[] = [
  'SCHD', 'VOO', 'QQQ', 'JEPI', 'JEPQ', 'DGRO', 'VYM', 'SPYD', 'VIG', 'DIVO', 'HDV', 'NOBL'
];

/** 수집 명단 — 인기 ETF 를 포함한다. 분류는 읽기 편하게 나눈 것일 뿐 동작에는 영향이 없다. */
export const ETF_ROSTER: readonly string[] = [
  ...POPULAR_ETFS,
  // 배당·인컴
  'SDY', 'DVY', 'SPHD', 'FDVV', 'DGRW', 'SCHY', 'VYMI', 'IDV', 'DIV', 'SDIV', 'QYLD', 'XYLD', 'RYLD',
  'DIVB', 'CGDV', 'FDL', 'PEY', 'RDVY', 'KNG', 'REGL', 'TDIV', 'LVHD', 'SPYI', 'QQQI', 'GPIX', 'GPIQ',
  'ISPY', 'SVOL', 'BALI', 'DGRS', 'DES', 'DHS', 'DLN', 'DTD', 'VIGI', 'IGRO', 'NUSI', 'CWS',
  // 미국 대형·전체 시장
  'SPY', 'IVV', 'VTI', 'SPLG', 'ITOT', 'SCHB', 'SCHX', 'VV', 'MGC', 'RSP', 'IWB', 'SPTM', 'DIA',
  // 성장·기술
  'QQQM', 'VGT', 'XLK', 'SCHG', 'VUG', 'IWF', 'MGK', 'SPYG', 'IUSG', 'SMH', 'SOXX', 'FTEC', 'IGV',
  'ARKK', 'XLC', 'FDN', 'SKYY', 'CIBR', 'BOTZ', 'AIQ',
  // 가치·배당 성향 섹터
  'VTV', 'IWD', 'SCHV', 'SPYV', 'IUSV', 'XLF', 'XLE', 'XLV', 'XLP', 'XLU', 'XLI', 'XLY', 'XLB',
  'VHT', 'VDC', 'VPU', 'VFH', 'VDE', 'VIS', 'VCR', 'VAW', 'VOX',
  // 중소형
  'IJH', 'VO', 'MDY', 'IJR', 'VB', 'IWM', 'SCHA', 'VBR', 'AVUV', 'IWN', 'VXF',
  // 부동산
  'VNQ', 'SCHH', 'XLRE', 'IYR', 'USRT', 'REET',
  // 해외
  'VXUS', 'VEA', 'VWO', 'IEFA', 'IEMG', 'EFA', 'EEM', 'SCHF', 'SCHE', 'ACWI', 'VT', 'IXUS', 'SPDW',
  // 채권(보유 종목이 채권이라 주식 ETF 와는 거의 겹치지 않는다 — 그 사실도 정보다)
  'BND', 'AGG', 'TLT', 'IEF', 'SHY', 'LQD', 'HYG', 'JNK', 'VCIT', 'VCSH', 'BNDX', 'TIP', 'SCHZ',
  'MUB', 'SGOV', 'BIL', 'JAAA', 'VGIT', 'VGLT', 'EMB'
];
