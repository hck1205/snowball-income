import { LEGACY_STORAGE_PREFIX, STORAGE_PREFIX } from './storagePrefix';

/**
 * 옛 접두사(`snowball:`)로 저장된 키를 새 접두사(`hungryhippo:`)로 **한 번에 옮긴다**.
 *
 * ## 왜 이름만 바꾸면 안 되는가
 * 접두사는 코드가 아니라 **사용자 기기에 남아 있는 데이터의 주소**다. 상수만 갈아끼우면 앱은 새 주소를
 * 보러 가고 그곳은 비어 있다 — 사용자에게는 팔레트·표시 통화가 초기화되고, 장부의 Google Sheets
 * 연결이 끊기고, 투어가 다시 뜨는 것으로 나타난다. 그중 제일 위험한 것은 `cloud-sync-base:<userId>` 다:
 * 클라우드 동기화의 **기준선**이라, 사라지면 충돌 해소가 기준 없이 판단한다.
 *
 * ## 설계
 * - **접두사 스캔**이지 키 목록이 아니다. `cloud-sync-base:<userId>` 처럼 동적 꼬리표가 붙는 키도
 *   자동으로 따라온다. 새 키가 추가돼도 이 함수를 고칠 일이 없다.
 * - **마커를 두지 않는다.** 이관이 끝나면 옛 접두사 키가 0개라 다음 부팅의 비용은 "키 목록 한 번 훑기"
 *   뿐이다. 마커가 없어서 얻는 것: 다른 탭이 옛 코드로 옛 키를 다시 써도 **다음 부팅이 스스로 고친다**
 *   (배포 직후 옛 탭과 새 탭이 공존하는 구간이 실제로 있다).
 * - **신 키가 이미 있으면 덮지 않는다.** 그쪽이 최신이다 — 새 코드가 이미 쓴 값을 옛 값으로 되돌리면
 *   사용자가 방금 한 설정이 사라진다.
 * - 옮긴 뒤 **옛 키를 지운다.** 남겨 두면 저장소가 두 배가 되고, 어느 쪽이 정본인지 다음 사람이 모른다.
 *
 * ## 실패는 조용히 강등된다
 * 사파리 프라이빗·저장소 차단·쿼터 초과에서 `localStorage` 접근 자체가 throw 한다. 그때는 **옛 키를
 * 남긴 채** 빠져나온다 — 다음 부팅이 다시 시도한다. 데이터를 잃느니 이관이 늦는 편이 낫다.
 *
 * 🔴 **읽는 코드보다 먼저 돌아야 한다.** `main.tsx` 본문 첫 줄에서 부른다(자세한 이유는 그쪽 주석).
 *    앱 코드에는 모듈 스코프 저장소 읽기가 없으므로(2026-08-17 확인) 그 자리면 충분하다 —
 *    import 순서에 기대는 side-effect 배선은 쓰지 않는다(정렬 도구 하나에 깨진다).
 */

/** SSR·노드 테스트(`window` 없음)와 사파리 프라이빗(접근이 throw)을 **두 겹**으로 막는다. */
const readArea = (pick: (win: Window) => Storage): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return pick(window);
  } catch {
    return null;
  }
};

/**
 * 한 저장 영역(local/session)을 옮기고 **옮긴 키 수**를 돌려준다.
 *
 * ⚠ 열쇠 목록을 **먼저 스냅샷**한다. `storage.key(i)` 로 훑으면서 같은 루프에서 지우면 인덱스가
 *   밀려 절반이 누락된다(이 함수의 이전 형태에서 실제로 겪을 수 있는 고전적 함정).
 */
const migrateArea = (storage: Storage): number => {
  const legacyKeys: string[] = [];

  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key !== null && key.startsWith(LEGACY_STORAGE_PREFIX)) legacyKeys.push(key);
    }
  } catch {
    return 0;
  }

  let moved = 0;

  for (const legacyKey of legacyKeys) {
    const nextKey = `${STORAGE_PREFIX}${legacyKey.slice(LEGACY_STORAGE_PREFIX.length)}`;

    try {
      const value = storage.getItem(legacyKey);

      if (value === null) {
        storage.removeItem(legacyKey);
        continue;
      }

      // 신 키가 이미 있으면 그쪽이 정본이다(새 코드가 이미 썼다). 옛 값으로 덮지 않는다.
      if (storage.getItem(nextKey) === null) {
        storage.setItem(nextKey, value);
        moved += 1;
      }

      storage.removeItem(legacyKey);
    } catch {
      // 쿼터 초과·차단. 옛 키를 남겨 둔 채 다음 키로 넘어간다 — 다음 부팅이 다시 시도한다.
    }
  }

  return moved;
};

/**
 * local·session 두 영역을 모두 옮긴다. 반환값은 **옮긴 키 총수**(계측·테스트용).
 *
 * ⚠ `sessionStorage` 도 같은 접두사 규약을 쓴다(`jotai/compare` 의 `compare-selection`,
 *   OAuth state/returnTo). 한쪽만 옮기면 로그인 왕복 중인 사용자가 state 를 잃는다.
 */
export const migrateLegacyStorageKeys = (): number => {
  const local = readArea((win) => win.localStorage);
  const session = readArea((win) => win.sessionStorage);

  return (local ? migrateArea(local) : 0) + (session ? migrateArea(session) : 0);
};
