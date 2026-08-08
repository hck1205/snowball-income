import type { DividendListId } from '@/shared/constants/dividendLists';

/** 목록 그림 한 장의 사실(경로·원본 크기). 배치(좌/우)는 그림을 쓰는 화면이 각자 정한다. */
export type DividendListMascot = {
  readonly src: string;
  /** 원본 픽셀. `width`/`height` 속성으로 그대로 넘겨 비율 자리를 미리 잡는다(CLS 방지). */
  readonly width: number;
  readonly height: number;
};

/**
 * 목록별 마스코트 그림 — **목록 페이지와 허브가 같은 그림을 쓴다.**
 *
 * 🔴 **경로 문자열로 참조한다 — `import` 하지 마라.** 세 장을 import 하면 어느 화면을 열어도 셋이
 * 전부 번들(또는 프리로드 대상)에 들어간다. `public/` 의 파일은 경로 그대로 서빙되므로 이게 유일한
 * 참조 방법이다.
 *
 * 🔴 이 표가 **단일 원천**이다(2026-08-05). 종전에는 목록 페이지가 자기 파일 안에 같은 표를 갖고
 * 있었고, 허브는 그림이 아예 없었다 — 허브를 랜딩형으로 세우면서 같은 표를 두 벌로 복제하는 대신
 * 여기로 올렸다. 자산을 갈아 끼울 때 고칠 곳이 한 군데다.
 */
export const DIVIDEND_LIST_MASCOT: Record<DividendListId, DividendListMascot> = {
  kings: { src: '/images/hippo/hippo_dividend_king.png', width: 440, height: 431 },
  aristocrats: { src: '/images/hippo/hippo_dividend_noble.png', width: 440, height: 432 },
  champions: { src: '/images/hippo/hippo_dividend_champ.png', width: 440, height: 414 },
  /*
   * ⚠ 히든스타 **전용 그림이 아직 없다.** 앞의 셋은 각 목록을 위해 그린 것이고 이건 기존 자산을
   *   빌려 쓴다 — 뜻은 맞다("찾아낸다"). 지어낸 자산을 만들 수는 없으므로 전용 그림이 생기면
   *   이 줄만 갈아 끼우면 된다(크기도 함께 고칠 것 — 원본 1024x1024 를 440 폭에 맞춰 적었다).
   */
  hiddenStars: { src: '/images/hippo/hippo_map.png', width: 440, height: 440 }
};
