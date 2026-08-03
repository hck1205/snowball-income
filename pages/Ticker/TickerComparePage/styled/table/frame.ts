import styled from '@emotion/styled';
import { color, font, media, space, subtleScrollbar } from '@/shared/styles';

/* ── 비교표 — 스크롤 상자와 표 몸통 ─────────────────────────────────────────── */

/**
 * 표가 좁은 폭에서 넘칠 때는 **가로 스크롤**로 흡수한다. 칸을 접거나 열을 감추면 비교가 깨진다 —
 * 비교표에서 열이 사라지는 것은 정보 손실이 아니라 **비교 자체의 실패**다.
 *
 * ## 🔴 가로 스크롤을 "필요한 폭에서만" 켠다 (2026-08-03)
 * 스크롤 상자를 항상 켜 두면 **열 머리를 세로로 고정할 수 없다.** CSS 는 overflow 두 축을 따로
 * 놀게 두지 않는다 — 한 축이 auto 면 나머지 visible 은 auto 로, clip 은 **hidden 으로 계산된다.**
 * 실측으로 확인했다: overflow-x: auto 만 적은 상태의 computed overflowY 는 auto 였고,
 * 회피하려고 overflow-y: clip 을 적었더니 computed 가 **hidden** 이 됐다(Chrome 150,
 * CSS.supports('overflow-y','clip') === true 인데도). 어느 쪽이든 이 상자가 세로 스크롤포트가
 * 되고, 그러면 자식의 position: sticky 는 **페이지가 아니라 이 상자**를 기준으로 잡는다 —
 * 상자는 세로로 스크롤되지 않으니 머리가 영영 안 붙는다(실측 thTop -191px).
 *
 * 그래서 상자를 **없앨 수 있는 폭에서는 없앤다.** 이 표는 최대 4종목(MAX_COMPARE_TICKERS)이라
 * 열이 다섯을 넘지 않는다. 넘침이 사라지는 임계를 재 보면(4종목 기준):
 * ```
 *   뷰포트   상자 폭   내용 폭   넘침
 *    860      777       844      67px
 *    900      816       844      28px
 *    940      853       853       0     <- 여기서부터 안 넘친다
 *   1280     1118      1118       0
 * ```
 * 경계는 임계(940)가 아니라 **`headerStack`(1024)** 을 쓴다. 이유 둘: ①84px 여유를 둬야 서체·
 * 로케일·열 내용이 조금 길어져도 임계를 밟지 않는다 ②1024 는 앱 헤더가 **한 줄이 되는** 폭이다
 * (그 아래는 2단이라 105~111px). 고정 머리가 붙을 자리를 정하는 값이 곧 헤더 높이라, 헤더가
 * 두꺼워지는 구간에서 굳이 세로 예산을 더 깎지 않는다.
 *
 * ⚠ 그래서 **1024px 미만에서는 열 머리가 고정되지 않는다** — 거기서는 가로 스크롤이 먼저다
 *   (좁은 폭에서 열이 잘리면 비교 자체가 성립하지 않는다). ScrollHint 가 그 폭에서만 뜨는 것도 같은 이유.
 *
 * ⚠ 그래서 `min-width: 560px` 를 낮추거나 열을 늘리면 **이 판단의 전제가 무너진다** —
 *   1024px 이상에서 넘치기 시작하면 그 폭에서 **페이지 전체가 가로로 흔들린다**(이 레포 단골 결함).
 *   바꾸려면 위 표를 `uiprobe` 로 다시 재고 경계를 옮겨라.
 */
export const TableScroller = styled.div`
  overflow-x: auto;
  overscroll-behavior-x: contain;
  min-width: 0;
  /* 🔴 앱 공용 스크롤바 — 부품마다 다른 막대가 나오지 않게 한다(scrollbarStyle.test.ts 가 잠근다). */
  ${subtleScrollbar}

  ${media.up('headerStack')} {
    /* 스크롤포트를 해제한다 → 열 머리의 sticky 기준이 뷰포트가 되어 앱 헤더 밑에 붙는다. */
    overflow: visible;
  }
`;

export const ScrollHint = styled.p`
  margin: 0 0 ${space[2]};
  color: ${color.textMuted};
  font-size: ${font.size.xs};

  ${media.up('tablet')} {
    display: none;
  }
`;

export const Table = styled.table`
  width: 100%;
  min-width: 560px;
  border-collapse: separate;
  border-spacing: 0;
  font-size: ${font.size.sm};
`;
