import type { DividendListId } from '@/shared/constants/dividendLists';
import type { DividendListUnknownReason } from '../utils';

/** 목록 하나가 화면에서 쓰는 문구 묶음. 세 목록이 같은 모양을 갖는다. */
export type DividendListPageCopy = {
  metaTitle: string;
  metaDescription: string;
  title: string;
  lede: string;
  definition: string;
  criterionLabel: string;
  caution: string;
};

/**
 * `/dividend/lists` · `/dividend/kings` · `/dividend/aristocrats` · `/dividend/champions` 의 모든 문구.
 * 🔴 컴포넌트에 문자열 리터럴을 박지 않는다(`.cursor/rules`).
 *
 * 🔴 **카피 규율**
 *  - 투자권유 금지. "유망하다·안전하다·사야 한다"를 쓰지 않는다. 약속형("~받게 됩니다") 금지 —
 *    조건부·설명형만 쓴다. 연속 증배 이력은 미래 배당을 보장하지 않으며, 그 사실을 각 페이지가 말한다.
 *  - **지어낸 숫자 0.** 종목 수는 데이터에서 세어 넣고, 기준일은 데이터의 `asOf` 를 그대로 쓴다.
 *  - 연속 증배 "연수"는 **목록 기준이 보장하는 하한·구간**으로만 쓴다. 종목별 정확값은 계산이
 *    불가능하다(근거: `shared/constants/dividendLists` 타입 머리말) — 표도 그 둘을 눈으로 구분해 그린다.
 *  - "눈덩이/스노우볼" 비유 전 표면 금지. 같은 개념은 복리·시간·재투자로 푼다.
 *  - `Dividend Aristocrats` 는 S&P Dow Jones Indices 의 **상표**다. 제목·본문은 한국어 서술어
 *    (배당귀족)를 쓰고, 영문 지수명은 출처를 밝히는 문장 안에서만 등장시킨다.
 */
const LISTS: Record<DividendListId, DividendListPageCopy> = {
  kings: {
    metaTitle: '배당킹 목록 — 50년 이상 배당을 늘려 온 미국 기업',
    metaDescription:
      '연속 증배 50년 이상으로 두 자료가 모두 확인한 미국 기업 목록입니다. 종목·섹터와 함께 출처와 기준일을 표기했습니다.',
    title: '배당킹',
    lede: '반세기 넘게 해마다 배당을 늘려 온 기업들입니다.',
    definition:
      '배당킹은 연속 증배 기간이 50년 이상인 미국 상장 기업을 가리키는 통칭입니다. 특정 지수의 공식 명칭이 아니라 시장에서 굳어진 표현이라, 어떤 기업을 포함할지는 자료를 만드는 곳마다 조금씩 다릅니다.',
    criterionLabel: '연속 증배 50년 이상',
    caution:
      '50년이라는 기간에는 1970년대의 고물가, 2008년 금융위기, 2020년 팬데믹이 모두 들어 있습니다. 그 기간을 통과했다는 사실이 앞으로도 같으리라는 뜻은 아닙니다.'
  },
  aristocrats: {
    metaTitle: '배당귀족 목록 — S&P 500에서 25년 이상 배당을 늘려 온 기업',
    metaDescription:
      'S&P 500 배당귀족 지수에 실제로 편입된 종목을 지수 추종 ETF 보유내역에서 확인하고 위키피디아 구성종목 표와 대조했습니다. 종목·섹터·기준일을 함께 표기했습니다.',
    title: '배당귀족',
    lede: 'S&P 500에 속하면서 25년 넘게 배당을 늘려 온 기업들입니다.',
    definition:
      '배당귀족은 S&P 500 구성종목 가운데 연속 증배 25년 이상이라는 조건을 지수 산출 기관이 정한 방식으로 심사해 편입한 종목입니다. 배당 이력만이 아니라 시가총액과 거래대금 조건도 함께 봅니다.',
    criterionLabel: 'S&P 500 소속 + 연속 증배 25년 이상',
    caution:
      '"S&P 500에 속하고 25년 이상 늘렸다"는 서술과 "지수에 실제로 편입돼 있다"는 같지 않습니다. 이 목록은 지수를 추종하는 ETF가 실제로 보유한 종목을 기준으로 삼았기 때문에, 서술 조건만으로 목록을 만든 다른 자료와 몇 종목이 다를 수 있습니다.'
  },
  champions: {
    metaTitle: '배당챔피언 목록 — 25~49년 배당을 늘려 온 미국 기업',
    metaDescription:
      'S&P 500 소속 여부와 무관하게 연속 증배 25년 이상인 미국 기업 목록입니다. 종목·섹터와 함께 출처와 기준일, 수록 범위를 표기했습니다.',
    title: '배당챔피언',
    lede: '지수 소속과 무관하게 25년 넘게 배당을 늘려 온 기업들입니다.',
    definition:
      '배당챔피언은 미국에 상장된 기업 가운데 연속 증배 25년 이상인 곳을 모은 목록입니다. 배당귀족과 기간 기준은 같지만 S&P 500 소속을 요구하지 않아, 규모가 작은 기업도 들어옵니다.',
    criterionLabel: '연속 증배 25~49년',
    caution:
      '지수 편입 심사를 거치지 않은 목록이라 규모가 작거나 거래가 한산한 종목이 섞여 있습니다. 종목마다 사업의 성격이 크게 다르므로 목록에 있다는 사실만으로 성격을 묶어 읽지 않는 편이 좋습니다.'
  }
};

export const DIVIDEND_LIST_COPY = {
  hub: {
    meta: {
      title: '배당킹·배당귀족·배당챔피언 — 오래 배당을 늘려 온 미국 기업 목록',
      description:
        '연속으로 배당을 늘려 온 기간을 기준으로 나눈 세 가지 목록입니다. 종목·섹터와 함께 목록의 출처와 기준일을 함께 표기했습니다.'
    },
    hero: {
      title: '배당 리스트',
      lede: '배당을 몇 년 연속 늘려 왔는지를 기준으로 나눈 세 목록입니다. 각 목록이 어디에서 왔고 언제 기준인지 함께 밝힙니다.'
    },
    /** 허브 상단의 상시 고지. 세 페이지가 공유하는 전제라 허브가 한 번 말한다. */
    notice:
      '연속 증배 이력은 과거의 기록이며 앞으로의 배당을 보장하지 않습니다. 목록에 있던 기업이 배당을 줄여 빠지는 일도 실제로 일어납니다.',
    sectionTitle: '세 가지 목록',
    tableHeading: '목록 비교',
    tableCaption: '세 목록의 기준 · 종목 수 · 기준일',
    columns: {
      list: '목록',
      criterion: '기준',
      count: '종목 수',
      asOf: '기준일'
    },
    cta: '목록 보기'
  },

  lists: LISTS,

  /** 세 목록 페이지가 공유하는 문구. */
  page: {
    definitionHeading: '무엇이 이 목록인가',
    criterionHeading: '기준',
    /**
     * 🔴 이 문단이 "표의 연속 증배 열은 왜 정확한 연수가 아닌가"에 답한다. 지우면 사용자는
     * "50년 이상"을 우리가 종목마다 직접 센 값으로 읽는다.
     */
    streakHeading: '연속 증배 연수에 "이상"이 붙는 이유',
    streakBody:
      '무료로 확인할 수 있는 자료들이 같은 종목에 서로 다른 연수를 적고 있으며, 배당 이력만으로 다시 계산해도 분할·합병·지급 주기 변경 때문에 어긋납니다. 그래서 증배가 시작된 해를 확인한 종목만 연수를 그대로 적고, 확인하지 못한 종목은 목록의 기준이 보장하는 하한을 "이상"으로 표기합니다. 표에서 두 표기는 서로 다른 모양으로 그려집니다.',
    tableHeading: '종목',
    tableCaptionSuffix: '종목 목록',
    sourceHeading: '출처와 기준일',
    sourceRolePrimary: '1차 자료',
    sourceRoleCrosscheck: '교차 확인',
    retrievedAtLabel: '확인일',
    asOfLabel: '기준일',
    countLabel: '수록 종목',
    /** ⚠ '종목'이 아니라 '종'이다 — `countLabel` 과 붙으면 "수록 종목 69종목"으로 낱말이 겹친다. */
    countUnit: '종',
    coverageHeading: '수록 범위',
    columnTicker: '티커',
    columnName: '종목명',
    /** 선행 배당률 — 최신 1회 지급액 × 연 지급횟수 ÷ 현재가. 열 이름이 그 정의를 다 담을 수 없어 각주로 푼다. */
    columnYield: '배당률',
    columnStreak: '연속 증배',
    columnGrowth: '5년 배당성장',
    columnSector: '섹터',
    columnConfirmedBy: '확인한 자료',
    sortHint: '열 제목을 누르면 정렬 순서가 바뀝니다.',
    sortAscLabel: '오름차순',
    sortDescLabel: '내림차순',
    /**
     * 정렬 축이 아닌 열의 이유. 목록 하나 안에서 값이 전부 같은 열은 눌러도 순서가 안 바뀐다 —
     * 그 사실을 말하지 않으면 사용자는 버튼이 고장 났다고 읽는다.
     */
    sortUnavailableLabel: '이 목록에서는 값이 모두 같아 정렬해도 순서가 바뀌지 않습니다.',

    /** 🔴 값이 없는 칸의 단 하나의 표기. 0 도 "없음"도 아니라는 것을 기호와 문장이 함께 말한다. */
    unknownMark: '—',
    /**
     * 빈칸의 이유. `utils` 의 `DividendListUnknownReason` 과 키가 1:1 이다 — 새 이유가 생기면
     * 타입이 여기 문장을 강제한다(문장 없는 빈칸이 새로 생길 수 없다).
     */
    unknownReason: {
      growthHistory: '배당 이력이 완결된 6개 연도에 못 미쳐 5년 성장률을 계산하지 않았습니다.',
      irregularPayout: '특별배당이나 지급 주기 변경이 섞여 정기 배당을 가려내지 못했습니다.',
      sectorSource: '이 종목의 섹터를 밝힌 자료가 없어 비워 두었습니다.',
      notMeasured: '이 목록에는 아직 실측 지표를 붙이지 않았습니다.'
    } satisfies Record<DividendListUnknownReason, string>,

    /** 하한 표기에 붙는 설명. 정확값과 구분되게 그리는 것만으로는 "왜"를 말할 수 없다. */
    streakBoundTitle: '목록의 기준이 보장하는 하한입니다. 종목별 정확한 연수가 아닙니다.',
    streakExactTitle: '자료로 확인한 연속 증배 연수입니다.',
    /** 숫자의 기준일. 배당률·성장률은 매일 움직여서 날짜 없이 쓰면 "지금 값"으로 읽힌다. */
    measuredAtLabel: '지표 실측일',
    sectorFilterLabel: '섹터로 좁히기',
    sectorFilterAll: '전체',
    filteredEmpty: '고른 섹터에 해당하는 종목이 없습니다.',
    filteredCountSuffix: '종목 표시 중',
    tickerPageLinkTitle: '소개 페이지 열기',
    relatedHeading: '다른 목록',
    hubLink: '배당 리스트 전체 보기',
    /**
     * 공용 푸터의 각주 슬롯에 들어가는 문장들.
     *
     * 🔴 "투자 자문이 아닙니다" 같은 **사이트 공통 고지는 여기 넣지 마라** — 그건 `PageFooter` 가
     * 이미 갖고 있고, 각주로 또 쓰면 같은 말이 한 화면에 두 번 나온다(`PageFooter` 머리말의 규칙).
     * 이 슬롯에는 **이 화면에서만 참인 문장**만 둔다.
     */
    footerNotesTitle: '이 목록에 대해',
    footerNotes: [
      '연속 증배 이력은 과거의 기록이며 앞으로의 배당을 보장하지 않습니다.',
      '목록은 표기된 기준일의 공개 자료를 정리한 것이고, 배당 정책은 기업의 결정에 따라 달라질 수 있습니다.',
      '배당률은 가장 최근 1회 지급액에 그 종목의 연 지급 횟수를 곱해 현재가로 나눈 값입니다. 지난 1년 동안 실제로 지급된 금액의 합이 아닙니다.',
      '5년 배당성장은 최근 5년간 정기 배당의 연평균 증가율입니다. 특별배당은 빼고 계산하며, 완결된 6개 연도의 이력이 없으면 "—"로 둡니다.',
      '연속 증배 열의 "이상"은 목록의 기준이 보장하는 하한이라는 뜻이며, 종목별로 실제 확인한 연수가 아닙니다. "이상" 없이 적힌 연수는 증배가 시작된 해를 확인한 종목이며, 해가 바뀌면 다시 셉니다.'
    ],

    /**
     * 🔴 위키피디아 자료를 쓰는 목록에만 붙는 줄. 위키피디아 본문은 **CC BY-SA 4.0** 이라
     * 출처 표기가 라이선스상의 **의무**다 — 링크만으로는 부족해서 라이선스 이름을 화면이 말한다.
     * (이 목록의 섹터 분류가 위키피디아 구성종목 표에서 왔다.)
     */
    wikipediaLicenseNote:
      '위키피디아에서 가져온 내용(구성종목·섹터 분류)은 CC BY-SA 4.0 라이선스를 따릅니다.',
    wikipediaLicenseLinkLabel: 'CC BY-SA 4.0',
    wikipediaLicenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/deed.ko'
  }
} as const;
