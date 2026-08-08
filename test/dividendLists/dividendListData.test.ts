// @vitest-environment node — 순수 데이터 계약 테스트(DOM 불필요).
import { describe, expect, it } from 'vitest';
import {
  CURATED_DIVIDEND_LISTS,
  DIVIDEND_LIST_ALL,
  DIVIDEND_LIST_HUB_PATH,
  DIVIDEND_LIST_IDS,
  DIVIDEND_LIST_SECTOR_LABEL,
  DIVIDEND_LISTS,
  EMPTY_DIVIDEND_LISTS_SNAPSHOT,
  dividendListPath,
  dividendListsSnapshotSchema,
  normalizeSectorLabel,
  parseDividendListsSnapshot,
  toDividendListId
} from '@/shared/constants/dividendLists';

/**
 * 배당 목록 데이터의 **계약**.
 *
 * 이 데이터가 화면에서 하는 일은 "이 종목이 이 목록에 있다"는 사실을 말하는 것뿐이라, 지켜야 할 것도
 * 그 사실의 형태다: 출처가 있고 · 기준일이 있고 · 종목이 중복되지 않고 · 빈 목록이 조용히 통과하지
 * 않는다. 넷 중 하나라도 무너지면 화면이 **거짓말을 하기 시작한다**(빈 목록은 "해당 종목이 없습니다"로,
 * 기준일 없는 목록은 "지금 기준"으로 읽힌다).
 */
describe('배당 목록 데이터', () => {
  it('네 목록이 전부 있고 데이터의 id 가 목록 id 와 일치한다', () => {
    expect(DIVIDEND_LIST_IDS).toEqual(['kings', 'aristocrats', 'champions', 'hiddenStars']);
    for (const id of DIVIDEND_LIST_IDS) {
      expect(DIVIDEND_LISTS[id].id).toBe(id);
    }
    expect(DIVIDEND_LIST_HUB_PATH).toBe('/dividend/lists');
    expect(DIVIDEND_LIST_ALL.map((list) => list.id)).toEqual([...DIVIDEND_LIST_IDS]);
  });

  /**
   * 🔴 id 와 경로 세그먼트가 **더 이상 같지 않다**(2026-08-08). `hiddenStars` 는 카멜케이스 id 이고
   *    주소는 `hidden-stars` 다 — 카멜케이스를 URL 에 그대로 쓰지 않기 때문이다.
   *    그래서 `'/dividend/' + id` 로 경로를 조립하는 코드가 있으면 그 자리에서 깨진다.
   *    조립은 `dividendListPath` 한 곳에서만 한다는 것을 여기서 못 박는다.
   */
  it('경로는 id 가 아니라 dividendListPath 가 정한다', () => {
    expect(dividendListPath('kings')).toBe('/dividend/kings');
    expect(dividendListPath('aristocrats')).toBe('/dividend/aristocrats');
    expect(dividendListPath('champions')).toBe('/dividend/champions');
    expect(dividendListPath('hiddenStars')).toBe('/dividend/hidden-stars');
  });

  it('목록마다 종목이 있고 티커가 중복되지 않는다', () => {
    for (const list of DIVIDEND_LIST_ALL) {
      expect(list.members.length).toBeGreaterThan(0);
      const tickers = list.members.map((member) => member.ticker);
      expect(new Set(tickers).size).toBe(tickers.length);
    }
  });

  it('티커 표기가 정규화돼 있다 — 클래스 주식은 점 표기 하나로만 들어온다', () => {
    // BF/B(ProShares) · BF-B(야후) 가 섞여 들어오면 같은 회사가 두 줄이 되고 교차검증이 어긋난다.
    for (const list of DIVIDEND_LIST_ALL) {
      for (const member of list.members) {
        expect(member.ticker).toMatch(/^[A-Z]{1,5}(\.[A-Z])?$/);
      }
    }
  });

  it('모든 종목에 정규화된 섹터와 그 근거(소스가 적어 준 문자열)가 있다', () => {
    for (const list of DIVIDEND_LIST_ALL) {
      for (const member of list.members) {
        expect(DIVIDEND_LIST_SECTOR_LABEL[member.sector]).toBeTruthy();
        expect(member.sourceSectorLabel.length).toBeGreaterThan(0);
        // 소스 문자열은 대응표를 통과해야 한다 — 통과 못 하면 대응표가 낡은 것이다.
        expect(normalizeSectorLabel(member.sourceSectorLabel)).toBe(member.sector);
      }
    }
  });

  it('🔴 목록마다 출처와 기준일이 있다 — 화면이 근거 없이 목록을 보여 주지 못하게 한다', () => {
    for (const list of DIVIDEND_LIST_ALL) {
      expect(list.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(list.sources.length).toBeGreaterThan(0);
      expect(list.sources.some((source) => source.role === 'primary')).toBe(true);
      for (const source of list.sources) {
        expect(source.url).toMatch(/^https:\/\//);
        expect(source.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
      expect(list.coverageNote.length).toBeGreaterThan(0);
      // 각 종목도 "누가 확인해 줬는가"를 갖는다 — 아무도 확인하지 않은 종목은 실을 수 없다.
      for (const member of list.members) expect(member.confirmedBy.length).toBeGreaterThan(0);
    }
  });

  it('배당킹은 두 자료가 모두 확인한 종목만 담는다', () => {
    // 무료 소스가 54종 vs 47종으로 갈리고 한쪽에는 실증된 오류가 있어 교차확인을 규칙으로 못 박았다.
    for (const member of DIVIDEND_LISTS.kings.members) {
      expect(member.confirmedBy.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('기준 연수가 목록의 성격과 맞는다', () => {
    expect(DIVIDEND_LISTS.kings.minimumStreakYears).toBe(50);
    expect(DIVIDEND_LISTS.aristocrats.minimumStreakYears).toBe(25);
    expect(DIVIDEND_LISTS.champions.minimumStreakYears).toBe(25);
    // 배당챔피언만 상한이 있다 — 출처가 50년 이상을 배당킹으로 따로 싣기 때문이다.
    expect(DIVIDEND_LISTS.champions.maximumStreakYears).toBe(49);
  });
});

describe('생성물 스냅샷 파싱', () => {
  it('형태가 깨진 생성물은 화면을 죽이지 않고 빈 스냅샷으로 떨어진다', () => {
    expect(parseDividendListsSnapshot({ nope: true })).toEqual(EMPTY_DIVIDEND_LISTS_SNAPSHOT);
    expect(parseDividendListsSnapshot(null)).toEqual(EMPTY_DIVIDEND_LISTS_SNAPSHOT);
  });

  it('🔴 빈 목록은 스키마가 막는다 — "종목이 없습니다"라는 거짓말을 데이터 단계에서 차단한다', () => {
    const emptyMembers = {
      asOf: '2026-08-03',
      source: 'test',
      lists: { kings: { ...CURATED_DIVIDEND_LISTS.kings, members: [] } }
    };
    expect(dividendListsSnapshotSchema.safeParse(emptyMembers).success).toBe(false);
  });

  it('생성물이 비어도 큐레이션 목록이 그대로 남는다 (폴백 계약)', () => {
    // 수집기가 한 번도 안 돌았거나 실패했을 때의 상태. 목록은 사라지지 않아야 한다.
    for (const id of DIVIDEND_LIST_IDS) {
      expect(CURATED_DIVIDEND_LISTS[id].members.length).toBeGreaterThan(0);
    }
  });

  it('모르는 목록 문자열은 null 로 좁혀진다', () => {
    expect(toDividendListId('kings')).toBe('kings');
    expect(toDividendListId('KINGS')).toBe('kings');
    expect(toDividendListId('nope')).toBeNull();
    expect(toDividendListId(null)).toBeNull();
  });
});
