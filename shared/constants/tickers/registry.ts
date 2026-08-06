import type { PresetTickerKey } from '@/shared/constants/presets';
import type { TickerCategoryId } from './TickerCategory';
import type { TickerContent } from './TickerContent.types';
import { SCHD_TICKER_CONTENT } from './schd';
import { VIG_TICKER_CONTENT } from './vig';
import { DGRO_TICKER_CONTENT } from './dgro';
import { DGRW_TICKER_CONTENT } from './dgrw';
import { SCHY_TICKER_CONTENT } from './schy';
import { HDV_TICKER_CONTENT } from './hdv';
import { VYM_TICKER_CONTENT } from './vym';
import { SPYD_TICKER_CONTENT } from './spyd';
import { JEPI_TICKER_CONTENT } from './jepi';
import { JEPQ_TICKER_CONTENT } from './jepq';
import { O_TICKER_CONTENT } from './o';
import { NOBL_TICKER_CONTENT } from './nobl';
import { SDY_TICKER_CONTENT } from './sdy';
import { RDVY_TICKER_CONTENT } from './rdvy';
import { QYLD_TICKER_CONTENT } from './qyld';
import { XYLD_TICKER_CONTENT } from './xyld';
import { DIVO_TICKER_CONTENT } from './divo';
import { KO_TICKER_CONTENT } from './ko';
import { JNJ_TICKER_CONTENT } from './jnj';
import { SPYI_TICKER_CONTENT } from './spyi';
import { QQQI_TICKER_CONTENT } from './qqqi';
import { VNQ_TICKER_CONTENT } from './vnq';
import { PG_TICKER_CONTENT } from './pg';
import { PEP_TICKER_CONTENT } from './pep';
import { MO_TICKER_CONTENT } from './mo';
import { VZ_TICKER_CONTENT } from './vz';
import { XOM_TICKER_CONTENT } from './xom';
import { DLN_TICKER_CONTENT } from './dln';
import { DON_TICKER_CONTENT } from './don';
import { DES_TICKER_CONTENT } from './des';
import { DHS_TICKER_CONTENT } from './dhs';
import { SDVY_TICKER_CONTENT } from './sdvy';
import { DVY_TICKER_CONTENT } from './dvy';
import { FDVV_TICKER_CONTENT } from './fdvv';
import { PEY_TICKER_CONTENT } from './pey';
import { FDL_TICKER_CONTENT } from './fdl';
import { RYLD_TICKER_CONTENT } from './ryld';
import { IDVO_TICKER_CONTENT } from './idvo';
import { SCHH_TICKER_CONTENT } from './schh';
import { VNQI_TICKER_CONTENT } from './vnqi';
import { VIGI_TICKER_CONTENT } from './vigi';
import { VYMI_TICKER_CONTENT } from './vymi';
import { IDV_TICKER_CONTENT } from './idv';
import { DWX_TICKER_CONTENT } from './dwx';
import { T_TICKER_CONTENT } from './t';
import { ABBV_TICKER_CONTENT } from './abbv';
import { CVX_TICKER_CONTENT } from './cvx';
import { MCD_TICKER_CONTENT } from './mcd';
import { MMM_TICKER_CONTENT } from './mmm';
import { IBM_TICKER_CONTENT } from './ibm';
import { CAT_TICKER_CONTENT } from './cat';
import { ADP_TICKER_CONTENT } from './adp';
import { ITW_TICKER_CONTENT } from './itw';
import { KMB_TICKER_CONTENT } from './kmb';
import { CL_TICKER_CONTENT } from './cl';
import { ED_TICKER_CONTENT } from './ed';
import { PLD_TICKER_CONTENT } from './pld';
import { VICI_TICKER_CONTENT } from './vici';
import { ENB_TICKER_CONTENT } from './enb';
import { VOO_TICKER_CONTENT } from './voo';
import { VTI_TICKER_CONTENT } from './vti';
import { QQQ_TICKER_CONTENT } from './qqq';
import { SPY_TICKER_CONTENT } from './spy';
import { IVV_TICKER_CONTENT } from './ivv';
import { VUG_TICKER_CONTENT } from './vug';
import { VT_TICKER_CONTENT } from './vt';
import { VXUS_TICKER_CONTENT } from './vxus';
import { DIA_TICKER_CONTENT } from './dia';
import { SMH_TICKER_CONTENT } from './smh';
import { SPHD_TICKER_CONTENT } from './sphd';
import { CGDV_TICKER_CONTENT } from './cgdv';
import { JPM_TICKER_CONTENT } from './jpm';
import { BAC_TICKER_CONTENT } from './bac';
import { WFC_TICKER_CONTENT } from './wfc';
import { GS_TICKER_CONTENT } from './gs';
import { MS_TICKER_CONTENT } from './ms';
import { V_TICKER_CONTENT } from './v';
import { MA_TICKER_CONTENT } from './ma';
import { AXP_TICKER_CONTENT } from './axp';
import { SPGI_TICKER_CONTENT } from './spgi';
import { HD_TICKER_CONTENT } from './hd';
import { LOW_TICKER_CONTENT } from './low';
import { WMT_TICKER_CONTENT } from './wmt';
import { TGT_TICKER_CONTENT } from './tgt';
import { COST_TICKER_CONTENT } from './cost';
import { CSCO_TICKER_CONTENT } from './csco';
import { UNH_TICKER_CONTENT } from './unh';
import { AMGN_TICKER_CONTENT } from './amgn';
import { PFE_TICKER_CONTENT } from './pfe';
import { MRK_TICKER_CONTENT } from './mrk';
import { LLY_TICKER_CONTENT } from './lly';
import { ORCL_TICKER_CONTENT } from './orcl';
import { QCOM_TICKER_CONTENT } from './qcom';
import { RTX_TICKER_CONTENT } from './rtx';
import { UNP_TICKER_CONTENT } from './unp';
import { AAPL_TICKER_CONTENT } from './aapl';
import { MSFT_TICKER_CONTENT } from './msft';
import { DE_TICKER_CONTENT } from './de';
import { NEE_TICKER_CONTENT } from './nee';
import { AMT_TICKER_CONTENT } from './amt';
import { UPS_TICKER_CONTENT } from './ups';
import { CVS_TICKER_CONTENT } from './cvs';
import { GD_TICKER_CONTENT } from './gd';
import { AVGO_TICKER_CONTENT } from './avgo';
import { TXN_TICKER_CONTENT } from './txn';

/**
 * 콘텐츠 엔트리가 준비된 티커만 이 레지스트리에 있다 — `PresetTickerKey`(계산 유니버스 전체)의
 * **부분집합**이다. `/ticker/all` 허브와 `/ticker/:name` 라우트 파라미터 해석이 이 맵 하나로
 * "이 티커의 SEO 페이지가 존재하는가"를 판정한다(존재하지 않으면 404 처리는 페이지 몫).
 *
 * **티커 하나 추가 = 이 파일에 한 줄 추가**가 전부다: ①새 데이터 파일
 * (`export const XXX_TICKER_CONTENT: TickerContent = {...}`, `schd.ts` 참고) ②아래 객체에 그 값
 * 등록. 페이지 컴포넌트·사이트맵·JSON-LD·목차는 전부 이 레지스트리(또는 `TICKER_CONTENT_LIST`)를
 * 순회해서 파생하므로 그 이상 손댈 파일은 없다.
 *
 * 2026-07-23: SCHD 템플릿 확정 후 10종 일괄 추가 — 배당성장(VIG·DGRO·DGRW·SCHY), 고배당(HDV·VYM·SPYD),
 * 커버드콜(JEPI·JEPQ), 리츠/월배당(O).
 * 2026-08-02: 1차 확충 8종 추가 — 배당성장(NOBL·SDY·RDVY), 커버드콜/옵션인컴(QYLD·XYLD·DIVO),
 * 개별 배당주(KO·JNJ). 전부 발행사·기업 공식 소스로 수치를 확인한 종목만 넣었다(확인 실패로 보류한
 * 후보는 각 데이터 파일의 주석이 아니라 이 배치의 핸드오프 기록에 남아 있다).
 * 2026-08-02: 2차 확충 8종 추가 — 옵션인컴(SPYI·QQQI), 리츠(VNQ), 개별 배당주(PG·PEP·MO·VZ·XOM).
 * SPHD 는 발행사 페이지가 스크립트 렌더라 운용보수·상장일을 확인하지 못해 **계산 유니버스에만
 * 넣고 콘텐츠 페이지는 만들지 않았다** — 빈 값으로 페이지를 세우지 않는다는 규율의 적용 사례다.
 * 2026-08-06: 3차 확충 32종 추가 — 배당성장 ETF(DLN·DON·DES·SDVY), 고배당 ETF(DHS·DVY·FDVV·PEY·FDL),
 * 커버드콜(RYLD·IDVO), 리츠 ETF(SCHH·VNQI), 해외 배당 ETF(VIGI·VYMI·IDV·DWX), 개별 배당주
 * (T·ABBV·CVX·MCD·MMM·IBM·CAT·ADP·ITW·KMB·CL·ED), 개별 리츠(PLD·VICI), 해외 개별주(ENB). 전부
 * 이미 계산 유니버스(각 preset 파일)에 2026-08-02 이전에 큐레이터가 실측해 둔 티커였고, 이번
 * 확충은 콘텐츠 페이지(정적 사실 — 운용보수·상장일·추종지수·배당 인상 이력)만 새로 조사해 추가했다.
 * MMM 은 2018년 배당킹이었다가 2024년 사업 분할과 함께 배당을 53.6% 삭감한 이력을, T 는 2022년
 * 배당 재설정 이력을 감추지 않고 정직하게 다룬다.
 * 2026-08-06: 4차 확충 46종 추가(59→105종) — 코어 지수 ETF(VOO·VTI·QQQ·SPY·IVV·VUG·VT·VXUS·
 * DIA·SMH·SPHD·CGDV), 대형 금융주(JPM·BAC·WFC·GS·MS·V·MA·AXP·SPGI), 유통·소비재(HD·LOW·WMT·
 * TGT·COST), 기술·통신장비(CSCO·ORCL·QCOM·AAPL·MSFT), 헬스케어(UNH·AMGN·PFE·MRK·LLY),
 * 산업재·운송(RTX·UNP·DE·GD), 유틸리티·리츠(NEE·AMT), 운송·유통(UPS·CVS), 반도체(AVGO·TXN).
 * 전부 계산 유니버스(각 preset 파일)에 이미 실측돼 있던 티커였고, 이번 확충은 콘텐츠 페이지(정적
 * 사실 — 운용보수·상장일·추종지수·배당 인상 이력)만 새로 조사해 추가했다. PFE·MRK·TXN·UPS·CVS는
 * 배당성향이 순이익 대비 90%를 넘거나(PFE·MRK·TXN) 100%를 넘는(UPS·CVS 계산 기준에 따라) 상태를
 * 숨기지 않고 정직하게 다루며, WFC(2020년 팬데믹 시기 80% 삭감)·TGT(배당킹 지위가 압박받는 둔화된
 * 인상 속도)도 마찬가지다. SPHD는 2026-08-02 세션에서 발행사 페이지가 스크립트 렌더라 콘텐츠를
 * 만들지 못했으나, 이번엔 애그리게이터 종합으로 보완했다.
 *
 * ⚠ 티커 하나를 추가하면 손댈 곳은 **셋**이다: 이 레지스트리, `index.ts` 배럴, 그리고
 * `shared/constants/tickerPages/index.ts` 의 `TICKER_PAGE_INDEX`(랜딩 검색용 경량 인덱스).
 * 세 번째를 빼먹으면 `test/landing/tickerPageIndexParity.test.ts` 가 빨개진다.
 */
export const TICKER_CONTENT_REGISTRY = {
  SCHD: SCHD_TICKER_CONTENT,
  VIG: VIG_TICKER_CONTENT,
  DGRO: DGRO_TICKER_CONTENT,
  DGRW: DGRW_TICKER_CONTENT,
  SCHY: SCHY_TICKER_CONTENT,
  HDV: HDV_TICKER_CONTENT,
  VYM: VYM_TICKER_CONTENT,
  SPYD: SPYD_TICKER_CONTENT,
  JEPI: JEPI_TICKER_CONTENT,
  JEPQ: JEPQ_TICKER_CONTENT,
  O: O_TICKER_CONTENT,
  NOBL: NOBL_TICKER_CONTENT,
  SDY: SDY_TICKER_CONTENT,
  RDVY: RDVY_TICKER_CONTENT,
  QYLD: QYLD_TICKER_CONTENT,
  XYLD: XYLD_TICKER_CONTENT,
  DIVO: DIVO_TICKER_CONTENT,
  KO: KO_TICKER_CONTENT,
  JNJ: JNJ_TICKER_CONTENT,
  SPYI: SPYI_TICKER_CONTENT,
  QQQI: QQQI_TICKER_CONTENT,
  VNQ: VNQ_TICKER_CONTENT,
  PG: PG_TICKER_CONTENT,
  PEP: PEP_TICKER_CONTENT,
  MO: MO_TICKER_CONTENT,
  VZ: VZ_TICKER_CONTENT,
  XOM: XOM_TICKER_CONTENT,
  DLN: DLN_TICKER_CONTENT,
  DON: DON_TICKER_CONTENT,
  DES: DES_TICKER_CONTENT,
  DHS: DHS_TICKER_CONTENT,
  SDVY: SDVY_TICKER_CONTENT,
  DVY: DVY_TICKER_CONTENT,
  FDVV: FDVV_TICKER_CONTENT,
  PEY: PEY_TICKER_CONTENT,
  FDL: FDL_TICKER_CONTENT,
  RYLD: RYLD_TICKER_CONTENT,
  IDVO: IDVO_TICKER_CONTENT,
  SCHH: SCHH_TICKER_CONTENT,
  VNQI: VNQI_TICKER_CONTENT,
  VIGI: VIGI_TICKER_CONTENT,
  VYMI: VYMI_TICKER_CONTENT,
  IDV: IDV_TICKER_CONTENT,
  DWX: DWX_TICKER_CONTENT,
  T: T_TICKER_CONTENT,
  ABBV: ABBV_TICKER_CONTENT,
  CVX: CVX_TICKER_CONTENT,
  MCD: MCD_TICKER_CONTENT,
  MMM: MMM_TICKER_CONTENT,
  IBM: IBM_TICKER_CONTENT,
  CAT: CAT_TICKER_CONTENT,
  ADP: ADP_TICKER_CONTENT,
  ITW: ITW_TICKER_CONTENT,
  KMB: KMB_TICKER_CONTENT,
  CL: CL_TICKER_CONTENT,
  ED: ED_TICKER_CONTENT,
  PLD: PLD_TICKER_CONTENT,
  VICI: VICI_TICKER_CONTENT,
  ENB: ENB_TICKER_CONTENT,
  VOO: VOO_TICKER_CONTENT,
  VTI: VTI_TICKER_CONTENT,
  QQQ: QQQ_TICKER_CONTENT,
  SPY: SPY_TICKER_CONTENT,
  IVV: IVV_TICKER_CONTENT,
  VUG: VUG_TICKER_CONTENT,
  VT: VT_TICKER_CONTENT,
  VXUS: VXUS_TICKER_CONTENT,
  DIA: DIA_TICKER_CONTENT,
  SMH: SMH_TICKER_CONTENT,
  SPHD: SPHD_TICKER_CONTENT,
  CGDV: CGDV_TICKER_CONTENT,
  JPM: JPM_TICKER_CONTENT,
  BAC: BAC_TICKER_CONTENT,
  WFC: WFC_TICKER_CONTENT,
  GS: GS_TICKER_CONTENT,
  MS: MS_TICKER_CONTENT,
  V: V_TICKER_CONTENT,
  MA: MA_TICKER_CONTENT,
  AXP: AXP_TICKER_CONTENT,
  SPGI: SPGI_TICKER_CONTENT,
  HD: HD_TICKER_CONTENT,
  LOW: LOW_TICKER_CONTENT,
  WMT: WMT_TICKER_CONTENT,
  TGT: TGT_TICKER_CONTENT,
  COST: COST_TICKER_CONTENT,
  CSCO: CSCO_TICKER_CONTENT,
  UNH: UNH_TICKER_CONTENT,
  AMGN: AMGN_TICKER_CONTENT,
  PFE: PFE_TICKER_CONTENT,
  MRK: MRK_TICKER_CONTENT,
  LLY: LLY_TICKER_CONTENT,
  ORCL: ORCL_TICKER_CONTENT,
  QCOM: QCOM_TICKER_CONTENT,
  RTX: RTX_TICKER_CONTENT,
  UNP: UNP_TICKER_CONTENT,
  AAPL: AAPL_TICKER_CONTENT,
  MSFT: MSFT_TICKER_CONTENT,
  DE: DE_TICKER_CONTENT,
  NEE: NEE_TICKER_CONTENT,
  AMT: AMT_TICKER_CONTENT,
  UPS: UPS_TICKER_CONTENT,
  CVS: CVS_TICKER_CONTENT,
  GD: GD_TICKER_CONTENT,
  AVGO: AVGO_TICKER_CONTENT,
  TXN: TXN_TICKER_CONTENT
} as const satisfies Partial<Record<PresetTickerKey, TickerContent>>;

/** SEO 콘텐츠가 준비된 티커 심볼만의 유니언 — `PresetTickerKey`의 부분집합. */
export type TickerContentKey = keyof typeof TICKER_CONTENT_REGISTRY;

/** 목록/사이트맵 순회용 배열. */
export const TICKER_CONTENT_LIST: TickerContent[] = Object.values(TICKER_CONTENT_REGISTRY);

/** slug(라우트 파라미터, 대소문자 무관)로 콘텐츠를 찾는다. 없으면 undefined — 404 판단은 호출부 몫. */
export const findTickerContentBySlug = (slug: string): TickerContent | undefined => {
  const normalized = slug.toLowerCase();
  return TICKER_CONTENT_LIST.find((entry) => entry.slug === normalized);
};

/** 카테고리로 그룹핑 (허브 페이지의 섹션별 목록용). */
export const listTickerContentByCategory = (categoryId: TickerCategoryId): TickerContent[] =>
  TICKER_CONTENT_LIST.filter((entry) => entry.categoryIds.includes(categoryId));
