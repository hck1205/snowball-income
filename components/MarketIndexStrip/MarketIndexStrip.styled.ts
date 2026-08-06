import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import type { IndexChange } from '@/shared/lib/marketIndices';
import { color, font, media, motion, radius, space, subtleScrollbar } from '@/shared/styles';

/**
 * 스트립 컨테이너 — **투명하다**(배경·테두리 없음). 이 부품이 어떤 면 위에 놓일지 모르기 때문이다
 * (랜딩 히어로의 그라데이션 위일 수도 있다). 면색은 셀이 각자 갖는다 — Item 주석 참고.
 * 카드 안에 카드를 만들지 않는 이유이기도 하다.
 */
export const Root = styled.section`
  display: grid;
  gap: ${space[3]};
  width: 100%;
  min-width: 0;
`;

/** 제목 + 메타. 좁아지면 자연스럽게 줄바꿈된다. */
export const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[1]} ${space[3]};
  min-width: 0;
`;

/** "주요 지수" — 환율 위젯 타이틀과 같은 레벨(h2). 값보다 작은 라벨 위계. */
export const Title = styled.h2`
  margin: 0;
  min-width: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  letter-spacing: -0.01em;
`;

/**
 * "전일 대비 · 참고용 시세" — 무엇 대비인지를 헤더가 한 번만 말한다.
 * 셀마다 라벨을 반복하면 5칸이 라벨 밭이 된다(환율 위젯엔 이 자리가 없어 값 옆에 라벨을 둔다).
 */
export const Meta = styled.span`
  min-width: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
`;

/** 옅은 '업데이트 실패' 표식 — 손익색이 아니라 중립 muted(환율 위젯과 동일). */
export const StaleMark = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
`;

/**
 * 지수 목록 — 스크린리더가 "목록, 항목 5개"로 개수와 경계를 먼저 알려 준다.
 * 셀은 링크·버튼이 아니라 **포커서블 요소가 0개**이고 탭 순서에 영향이 없다.
 *
 * 🔴 **가로 티커 한 줄**이다(2026-08-02 사용자 결정으로 카드 격자에서 바뀜). 구 형태는 6칸이 각자
 * 상자를 가져 카드 6장만큼의 무게를 차지했고, 배당을 처음 접하는 사람에게 그 정보량은 서사를 밀어냈다.
 * 지금은 "살아 있는 데이터"라는 **신호**만 남기고 높이를 크게 줄인다.
 * 부품은 자기가 놓인 컨테이너 폭을 모르므로(뷰포트 1440px 에서도 320px 패널 안일 수 있다)
 * 브레이크포인트가 아니라 **가로 스크롤**로 좁은 폭을 흡수한다.
 */
export const List = styled.ul`
  display: flex;
  align-items: stretch;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;

  /*
   * 🔴 **칸을 폭 전체에 고르게 편다**(2026-08-03 사용자 지시).
   * 종전에는 칸들이 왼쪽에 몰려 서고 오른쪽에 빈 띠가 길게 남았다 — 띠가 전폭인데 내용은
   * 왼쪽 절반에만 있어 "덜 채워진 상자"로 읽혔다.
   *
   * ⚠ space-between 은 **내용이 컨테이너보다 좁을 때만** 효과가 있다. 넘치는 순간에는
   *   아래 overflow-x: auto 가 이기고 칸들은 다시 왼쪽부터 붙는다 — 그게 맞는 동작이다
   *   (넘칠 때 억지로 벌리면 첫 칸이 왼쪽 밖으로 밀려 나간다).
   * ⚠ 그래서 이 한 줄로 **넓은 폭에서는 고르게, 좁은 폭에서는 스크롤**이 둘 다 성립한다.
   */
  justify-content: space-between;

  /*
   * 양 끝 여백(2026-08-03 사용자 지시). space-between 은 첫 칸을 왼쪽 벽에, 마지막 칸을 오른쪽
   * 벽에 **딱 붙인다** — 띠에 면색이 있어서 글자가 모서리에 닿으면 답답해 보인다.
   *
   * ⚠ **가로만** 준다. 세로 여백은 이미 Item 이 갖고 있어(padding space[2]) 여기에 또 주면
   *   띠 높이가 두 배로 뛴다 — 이 부품은 높이를 줄이려고 카드 격자에서 띠로 바꾼 것이다.
   * ⚠ 이 요소는 overflow-x: auto 스크롤 컨테이너다. 넘칠 때 **끝쪽 여백을 잃는** 엔진이 있어
   *   실측했다 — 2026-08-03 Chrome:
   *     1280px(안 넘침): 앞 12 · 뒤 12, 칸은 space-between 으로 고르게 펴진다
   *      390px(넘침, scrollW 739 > clientW 366): 앞 12 · **끝까지 스크롤해도 뒤 12 유지**
   *   즉 이 엔진에서는 트레일링 패딩이 살아남는다. 다른 엔진에서 뒤 여백이 사라지면 그때는
   *   ::after 스페이서가 아니라 **마지막 칸의 margin** 으로 풀어라 — ::after 는 flex 항목이 되어
   *   space-between 배분에 끼어들고, 그러면 안 넘치는 폭에서 마지막 칸이 오른쪽 끝에 안 붙는다.
   */
  padding-inline: ${space[3]};

  /*
   * 🔴 **테두리를 두지 않는다**(2026-08-02 사용자 결정 — 상자처럼 보이는 것이 거슬린다).
   * 면색은 남긴다: 변동률에 쓰는 dataPositive/dataNegative 의 대비는 'contrast.test.ts' 가
   * **surface·surfaceMuted 위에서만** 16조합을 검증한다. 완전 투명으로 두면 그 아래 'bg' 위에
   * 검증되지 않은 색을 얹게 된다 — 투명으로 가려면 그 쌍을 테스트에 먼저 추가해야 한다.
   */
  background: ${color.surfaceMuted};
  border-radius: ${radius.md};

  /* 좁아지면 줄바꿈이 아니라 **가로 스크롤**이다. 줄바꿈하면 높이가 튀어 첫 화면이 흔들린다.
     증권사 시세 띠와 같은 어법이라 사용자가 이미 아는 동작이다. */
  overflow-x: auto;
  overscroll-behavior-x: contain;
  /* 🔴 앱 공용 스크롤바(투자 설정 드로어와 같은 것) — 부품마다 다른 막대가 나오지 않게 한다. */
  ${subtleScrollbar}

  /* 🔴 넘칠 때만 오른쪽 가장자리를 흐린다 — "더 있다"를 스크롤바 없이도 말한다.
     mask-image 는 색을 안 쓰므로 프리셋·다크모드와 무관하게 동작한다(대비 게이트 대상 아님). */
  mask-image: linear-gradient(to right, #000 calc(100% - 24px), transparent);

`;

/**
 * 셀 — 🔴 **면색은 이제 List 가 갖는다**(위 참조). 그래도 제약은 그대로다:
 * 변동률에 쓰는 dataPositive/dataNegative 는 shared/styles/contrast.test.ts 가
 * **surface·surfaceMuted 위에서만** 전 프리셋 8종 × light/dark = 16테마 4.5:1 을 강제한다.
 * List 의 배경을 surfaceSunken·bg·그라데이션으로 바꾸면 **검증되지 않은 쌍** 위에 데이터색을 얹는 것이다
 * (바꾸려면 contrast.test.ts 에 쌍을 먼저 추가할 것).
 */
export const Item = styled.li`
  /*
   * 🔴 **아래 position: relative 를 지우지 마라.** 셀 안의 시각 숨김 문장(VisuallyHidden)이
   * position: absolute 인데, 위치 기준 조상이 없으면 그 요소의 컨테이닝 블록이 스크롤러 **밖**이 되어
   * List 의 overflow-x: auto 로 잘리지 않는다. 그러면 여섯 번째 셀의 숨김 문장이 문서 좌표
   * x≈650px 에 남아 **문서 전체에 가로 스크롤**이 생긴다(390 실측: 문서 폭 390 → 679).
   * 눈에는 아무것도 안 보이는데 페이지가 옆으로 밀리는 형태라 원인을 찾기 어렵다 —
   * 회귀는 tools/dev/headerprobe.mjs 의 가로 오버플로 검사가 잡는다.
   */
  position: relative;

  /* 🔴 한 줄 안에서 **가로로** 눕는다(구 세로 스택). 라벨·값·변동률이 눈으로 한 번에 읽힌다. */
  display: flex;
  align-items: baseline;
  gap: ${space[1]};
  flex: none;
  /* 1280 에서 6칸이 스크롤 없이 들어가는 여백이다(실측: space[3] 이면 129px 초과해 마지막 칸이 잘렸다).
     칸이 더 늘면 자연히 스크롤로 넘어간다 — 그때는 잘림이 아니라 스크롤이라 읽힌다. */
  padding: ${space[2]};
  white-space: nowrap;

  /* 칸 구분은 **간격**이 한다 — 선을 두면 다시 표처럼 읽힌다(2026-08-02 테두리 제거와 같은 결정). */
`;

/** 지수명 — 로딩 중에도 실제 텍스트로 그린다(무엇을 기다리는지 보이고, 도착 시 레이아웃이 그대로다). */
export const Name = styled.span`
  overflow: hidden;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  white-space: nowrap;
  text-overflow: ellipsis;
`;

/**
 * 현재가 — 셀의 앵커.
 * ⚠ 값 숫자는 **중립 토큰(text)만**. 색이 붙는 것은 아래 Change(전일 대비 변동률)뿐이다.
 * ⚠ 서체는 dataNumeric(그 화면의 주인공 숫자 한 곳에만 쓰는 heroNumeric 이 아니다 — 여기 숫자는 5개고
 *   최종 자리는 랜딩 히어로 하단이라 hero 숫자는 히어로가 갖는다).
 */
export const Value = styled.span`
  overflow: hidden;
  color: ${color.text};
  font-family: ${font.dataNumeric};
  /* 한 줄 띠라 lg/bold 는 과하다 — 띠 높이가 카드 시절로 되돌아간다.
     md(15px) → base(14px) → sm(13px) → xs(12px) 로 세 단계 내렸다(2026-08-02 사용자 요청, 1px 씩).
     ⚠ 아래 ValueMuted **그리고 Change·ChangeMuted 와 같은 값을 유지**하라 — 네 요소가 한 줄에
       나란히 서므로 하나만 갈리면 값 없는 칸에서 셀 높이와 기준선이 흔들린다. */
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  letter-spacing: -0.02em;
  white-space: nowrap;
  text-overflow: ellipsis;
  ${font.numeric}

  /*
   * 🔴 좁은 폭에서는 **현재가를 감추고 라벨 + 변동률만** 남긴다(2026-08-02 사용자 결정).
   * 지수 절대값(7,489.72)은 좁은 화면에서 가장 먼저 버릴 정보다 — "올랐나 내렸나"가 신호의 본체이고
   * 절대값은 여섯 칸을 전부 밀어내는 가장 긴 요소다.
   * ⚠ 'display: none' 이라 스크린리더에서도 빠진다. 그래도 정보 손실이 아니다 — 변동률 옆의
   *   시각 숨김 문장이 "전일 대비 N% 상승"을 그대로 읽어 주기 때문이다.
   */
  ${media.down('mobileWide')} {
    display: none;
  }
`;

/** 값을 못 받은 자리의 대시 — 크기는 Value 와 같게 두어 셀 높이가 흔들리지 않는다. */
export const ValueMuted = styled.span`
  color: ${color.textMuted};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  letter-spacing: -0.02em;
  ${font.numeric}
`;

/*
 * ⚠ 값 본체는 중립(color.text)이고, 색이 붙는 것은 **전일 대비 변동률뿐**이다.
 * 전일 대비 변동은 손익(P&L)이 아니라 시세의 방향이고, dataPositive/dataNegative 램프는
 * primitives.ts 가 "숫자(데이터)에만" 쓰라고 규정한 바로 그 용도(한국 증권 관례: 상승=적/하락=청)다.
 * 금지는 값 본체에 남는다 — 환율 1,478원·지수 6,755.75 는 상태값이라 색을 칠하면 "손실"로 오독된다.
 * 색은 단독 채널이 아니다: **모양(▲/▼)**·부호(+/-)·스크린리더 문장("전일 대비 0.32% 상승")이 방향을
 * 항상 병기하므로 색을 못 보는 사용자도 정보를 하나도 잃지 않는다.
 * 근거는 decisions.md 의 [2026-07-28] 항목이며, 그 항목은 아직 ⏳사용자 승인 대기다 — 확정 결정으로
 * 인용하거나 다른 표면(티커 카드·포트폴리오 표)으로 넓히지 말 것. 미승인으로 결론나면 되돌림은 아래
 * CHANGE_COLOR 맵의 up·down 을 color.textSecondary 로 바꾸는 2줄이다(ChangeRow 의 color 만 중립으로
 * 고치면 이 맵이 고아가 돼 noUnusedLocals 에 걸려 tsc 가 깨진다).
 */
const CHANGE_COLOR: Record<IndexChange['direction'], string> = {
  up: color.dataPositive,
  down: color.dataNegative,
  flat: color.textSecondary
};

/**
 * 등락 한 덩어리(방향 마크 + 숫자). **색은 여기 한 곳에서만** 정해지고 자식이 상속받는다 —
 * 마크와 숫자가 따로 색을 고르면 언젠가 갈라진다.
 *
 * ⚠ 스펙(§D-3)이 함께 요구했던 `justify-self: end`(우측 정렬)는 **넣지 않았다.** 그 처방은 셀이
 * 3열 그리드이던 시절의 것이고, 지금 `Item` 은 `display: flex` 한 줄 티커라 `justify-self` 가
 * 무시된다(정렬 축이 아예 없다). 정렬을 되살리려면 `Item` 을 그리드로 되돌리는 것이 선행이다.
 */
export const ChangeRow = styled.span<{ $direction: IndexChange['direction'] }>`
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  min-width: 0;
  color: ${({ $direction }) => CHANGE_COLOR[$direction]};
  white-space: nowrap;
`;

/**
 * 방향 마크. 숫자 서체(Snowball Numeric)에는 U+25B2/25BC 글리프가 없어 어차피 폴백으로 그려지므로
 * 스택을 본문 서체로 **명시**해 폴백 경로를 앱의 다른 한글과 같게 고정한다.
 * 색은 부모에서 상속받는다 — 여기에 color 를 쓰지 마라.
 */
export const ChangeMark = styled.span`
  flex: 0 0 auto;
  font-family: ${font.sans};
  font-size: 0.8em;
  line-height: 1;
`;

/**
 * 변동률 숫자.
 * 🔴 **이 요소의 textContent 를 오염시키지 마라** — 방향 마크는 형제(`ChangeMark`)로만 붙인다.
 * 안에 넣으면 "+0.15%" 정확일치 계약이 깨지고, `::before content` 로 넣으면 통과는 하지만
 * 복사·번역 경로에서 조용히 사라진다.
 */
export const Change = styled.span`
  color: inherit;
  font-family: ${font.dataNumeric};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.tight};
  white-space: nowrap;
  ${font.numeric}
`;

/** 변동률이 없는 자리(전일값 부재 · 결손). Change 와 같은 크기·행간이라 셀 높이가 유지된다. */
export const ChangeMuted = styled.span`
  overflow: hidden;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.tight};
  white-space: nowrap;
  text-overflow: ellipsis;
`;

/** 값이 하나도 없을 때의 중립 안내 — 가짜 시세를 그리지 않는다. */
export const Message = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
`;

/**
 * 스크린리더 전용 문장 — 부호·색이 말하는 방향과 단위를 말로 옮긴다.
 * 공용 프리미티브를 만들지 않는 것이 이 레포 관례라 컴포넌트마다 로컬로 둔다.
 */
export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

/*
 * 스켈레톤 애니메이션은 ExchangeRateWidget 의 것을 **복제**했다(12줄) — 컴포넌트 간 styled import 는
 * 금지다. 공용 Skeleton 프리미티브 승격은 세 번째 소비처가 생기면 그때.
 */
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

/**
 * 로딩 스켈레톤 바 — 값 셀과 **같은 줄 구성/높이**로 렌더해 레이아웃 점프를 없앤다.
 * 1em 높이는 담는 요소의 font-size 를 따라간다.
 *
 * reduced-motion 에서 **일부러 되찾지 않는다**(2026-07-30 판정, ExchangeRateWidget 과 같은 근거):
 * 스켈레톤은 "아직 살아 있다"가 아니라 **"이 자리에 올 값이 아직 없다"**를 말하고 그건 회색 막대의
 * *모양*이 통째로 말한다. 펄스의 쉬는 프레임이 `opacity: 1` 이라 정지가 가장 잘 보이는 프레임이다.
 * (되찾는 쪽은 **스피너** — 그건 모양만으로는 "멈췄다/일한다"를 구분하지 못한다.)
 */
export const SkeletonBar = styled.span<{ w: string }>`
  display: block;
  height: 1em;
  width: ${({ w }) => w};
  border-radius: ${radius.sm};
  background: ${color.surfaceSunken};
  animation: ${pulse} 1.2s ${motion.ease} infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
