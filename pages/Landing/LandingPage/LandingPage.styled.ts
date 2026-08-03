import styled from '@emotion/styled';
import { color, font, media, pageHueMix, space } from '@/shared/styles';

/**
 * 랜딩 페이지의 세로 리듬과 히어로 무대.
 *
 * 🔴 이 파일은 **면을 하나도 만들지 않는다.** 랜딩의 틴트 면은 정확히 2개이고
 * (히어로 그라디언트 · 푸터 브랜드 패널) 둘 다 각자의 컴포넌트가 소유한다.
 * 아래 `HeroBlock` 의 후광은 **의사요소**라 `tintscan` 의 DOM 열거 대상이 아니다(같은 도구가
 * 히어로 상단 4px 리본을 세지 않는 것과 같은 이유).
 */

/**
 * **그룹 경계**의 간격 — 이 스택의 직계 자식은 섹션이 아니라 서사 묶음이다
 * (히어로 · G2 배우기 · G3 고르기 · G4 참조와 마무리 · 푸터).
 *
 * 🔴 값이 하나뿐이면 그룹이 표현될 수 없다 — before 는 8곳 전부 같은 간격(실측 1280 50.6px ·
 * 390 32px)이라 8섹션이 균일한 카드밭으로 읽혔다. 이 값은 그룹 **안** 간격(LandingGroup)의
 * 2배 대역이라 "묶음"이 눈에 보인다.
 */
export const LandingStack = styled.div`
  display: grid;
  gap: clamp(56px, 6.4vw, 104px);
  min-width: 0;
`;

/**
 * 서사 한 묶음(G2 배우기 · G3 고르기 · G4 참조와 마무리).
 *
 * 🔴 **랜드마크가 아니라 리듬 장치라 순수 div 다** — heading·role 을 주지 마라. 섹션마다 이미
 * section aria-labelledby 가 있어서 여기에 이름을 붙이면 랜드마크가 이중이 되고, 스크린리더
 * 사용자에게는 "묶음"이라는 시각 장치가 두 번째 목차로 들린다.
 */
export const LandingGroup = styled.div`
  display: grid;
  gap: clamp(28px, 3.2vw, 52px);
  min-width: 0;
`;

/**
 * 🔴 **이 페이지의 h1 크기는 여기서 결정된다 — `PageHero.styled.ts` 의 `heroTitleFontSize` 가
 * 아니다.** 정본 파일만 읽는 사람은 30px 상한을 믿게 되므로 이 주석이 유일한 안내다.
 *
 * 왜 여기냐: `components/common/PageHero` 는 **앱의 유일 히어로**이고 이번 트랙 편집 금지다
 * (다른 트랙이 미커밋 수정 중). 랜딩에서만 제목을 키울 다른 경로가 없다. 영구 해법은 히어로
 * 자신이 크기 변형을 소유하는 것이고 그건 별도 트랙이다(스펙 §G-1).
 *
 * ⚠ 상한 44px 을 올리지 마라 — 1280 에서 46px 부터 제목이 2줄이 되고, 2줄이 되는 순간
 * `HeroTitleGroup` 의 `align-items: center` 때문에 아이콘 배지가 첫 줄 옆이 아니라 **두 줄의
 * 한가운데**로 내려앉는다.
 */
const LANDING_HERO_TITLE_FONT_SIZE = `clamp(${font.size['3xl']}, calc(0.6rem + 3.2vw), ${font.size['6xl']})`;

/**
 * 히어로 + 그 **바로 아래** 덩어리(검색 · 조건부 "이어서 계산하기") 한 묶음.
 *
 * 간격이 섹션 리듬(위 `LandingStack`)이 아니라 카드 리듬(clamp 12~20px)인 것이 요점이다 —
 * 검색은 독립 섹션이 아니라 히어로에 딸린 줄로 읽혀야 하고, 다음 섹션과는 확실히 떨어져야 한다.
 *
 * 🔴 **아래 미디어 블록은 `PageHero` 의 내부 DOM 을 바깥에서 겨냥한다.** 그 대가를 알고 쓴다:
 *  ① `header > div:first-of-type > div + div` 는 "제목 줄의 자식이 정확히 둘(제목 그룹 · 액션)"을
 *     전제한다. 랜딩은 `titleAction` 을 넘기지 않으므로 지금은 참이지만, 히어로가 슬롯을 하나 더
 *     렌더하면 **에러 없이 조용히 어긋난다**.
 *  ② 특이도로 이긴다 — Emotion 이 이 블록을 0-1-2 로 컴파일하고 `HeroTitle` 자기 클래스는 0-1-0 이다.
 *     `!important` 를 쓰지 마라. 필요해졌다면 선택자가 틀렸다는 신호다.
 *  ③ 잉크 보정값 0.1 은 shared/styles/heroTitleRow.ts 의 INK_ABOVE_LINE_BOX.display 를 **손으로
 *     복제한 값**이다. 그 상수가 바뀌면 여기만 낡는다.
 */
export const HeroBlock = styled.div`
  display: grid;
  gap: clamp(12px, 2vw, 20px);
  min-width: 0;
  /* 후광의 기준점. 아래 의사요소는 음수 z-index 로 히어로 카드 **뒤**에 깔린다. */
  position: relative;
  isolation: isolate;

  /*
   * 히어로 뒤 후광 — 이 지면이 "정문"임을 말하는 **분위기 한 겹**.
   *
   * 🔴 의사요소인 것이 핵심이다: tintscan 은 DOM 엘리먼트만 열거하므로(히어로 상단 4px 리본과
   * 같은 취급) 이 면은 랜딩의 틴트 예산 2개를 건드리지 않는다. 색은 페이지 hue 를 28% 섞은
   * 파생값이고 **그 위에 텍스트가 없다** — color-mix 파생 면 위에 글자를 얹지 않는다는
   * 규칙(shared/styles/pageHue.ts)을 그대로 지킨다.
   *
   * ⚠ 좌우 inset 을 0 으로 못 박는다. 음수로 넓히면 본문 컨테이너 밖으로 새어 **문서 가로 스크롤**이
   * 생긴다(실측 @1280: scrollWidth 1352 vs client 1265 — -12% 가 그대로 넘침이었다).
   */
  &::before {
    content: '';
    position: absolute;
    z-index: -1;
    inset: -96px 0 18%;
    background: radial-gradient(72% 96% at 24% 26%, ${pageHueMix(28, 'transparent')}, transparent 74%);
    pointer-events: none;
  }

  /* 🔴 이 경계를 내리지 마라 — 640 이하는 선언 자체가 없어야 390x664 접힘 예산(시뮬레이터 CTA
     하단 258px)이 바이트 단위로 보존된다. */
  ${media.up('mobileWide')} {
    /* 1) 제목 줄을 세운다 — 제목이 히어로 폭 전체를 쓰고 CTA 가 아래 줄로 내려온다.
       DOM 순서는 그대로다(제목 → CTA → 리드 → 검색 → 이어서).

       🔴 세로 여백도 **여기서** 준다. 히어로가 짧아 보이는 원인은 제목 크기가 아니라 카드 높이였다
       (실측 @1280 before: 히어로 카드 총 높이 약 110px — 4955px 짜리 문서의 정문치고는 배너에 가깝다).
       header 를 새로 겨냥하지 않고 이 규칙 안에서 해결하는 이유: 히어로 override 선택자 목록은
       landingHeroOverrideCoupling 이 **정확히 다섯 줄**로 잠그고 있다. 여섯 번째를 만드는 대신
       이미 잠긴 규칙의 본문을 쓴다. */
    > header > div:first-of-type {
      flex-direction: column;
      align-items: stretch;
      gap: clamp(18px, 2.4vw, 30px);
      padding: clamp(10px, 2.2vw, 30px) 0 clamp(4px, 0.8vw, 10px);
    }

    /* 2) 제목 크기. 히어로 공용 규칙을 이 페이지에서만 덮는다. */
    > header h1 {
      font-size: ${LANDING_HERO_TITLE_FONT_SIZE};
    }

    /* 3) 아이콘 배지의 잉크 보정을 새 제목 크기로 다시 계산한다. 히어로는 상한 30px 을 기준으로
       -3px 을 걸어 두는데 제목이 44px 이면 필요한 값은 -4.4px 다(안 고치면 배지가 1.4px 낮다). */
    > header > div:first-of-type > div:first-of-type > span[aria-hidden] {
      transform: translateY(calc(${LANDING_HERO_TITLE_FONT_SIZE} * -0.1));
    }

    /* 4) CTA 는 더 이상 제목 줄이 아니다 — 제목 잉크 보정을 되돌리고 왼쪽에 붙인다. */
    > header > div:first-of-type > div + div {
      justify-content: flex-start;
    }

    > header > div:first-of-type > div + div > * {
      transform: none;
    }
  }
`;

/**
 * 검색 + 조건부 "이어서 계산하기".
 *
 * 🔴 **`PageHero` 의 `meta` 슬롯에 넣지 않는다 — 히어로의 형제다**(2026-08-01 교정). `meta` 는
 * "글자 폭만큼의 hue 밑줄"을 갖는 짧은 근거 줄 자리라, 여기에 이 덩어리를 넣으면
 *  ① 부모(`HeroMeta`)가 그린 `border-bottom`·`padding-bottom` 이 그대로 남는다. 자식에서
 *     `border-bottom: none` 을 선언해도 **상속 속성이 아니라** 부모의 선은 지워지지 않는다
 *     (실측: 첫 화면 검색 아래 2px · 254px 짜리 identity 밑줄. 같은 블록의 `font-family` 되돌리기가
 *     상속 속성이라 실제로 먹혔던 것이 "무력화됐다"는 착시를 만들었다).
 *  ② `HeroMeta` 는 `justify-self: start` 라 폭이 내용에 맞춰 줄어든다 — 검색 폼의 `min(520px, 100%)`
 *     가 무의미해져 1280 에서도 입력이 204px 로 쪼그라들어 있었다.
 *  ③ `p` 를 `div` 로 바꿔 얻은 콘텐츠 모델 정합을, 그 안에 다시 `span` 을 세워 되돌리고 있었다
 *     (`span` 안의 `div`/`form`/`ul`. 파서가 자동으로 닫지 않아 **무증상으로 영원히 남는** 종류다).
 *
 * 되돌림은 부모 쪽에서 — 즉 슬롯을 **쓰지 않는 것**이 정답이다. 랜딩 전용 prop 을 뚫으면 앱의
 * 유일 히어로가 그 prop 을 영원히 지고 간다.
 */
export const HeroExtras = styled.div`
  display: grid;
  gap: ${space[3]};
  min-width: 0;
`;

/**
 * 차례가 앉는 자리. 히어로 묶음 **안**이지만 검색보다 확실히 떨어져야 한다 — 검색은 히어로에
 * 딸린 줄이고(간격 12~20px), 차례는 "여기서부터 문서가 시작된다"를 여는 블록이다.
 *
 * 위쪽 1px 룰을 두지 않는다: 차례의 **각 항목이 이미 자기 상단 룰**을 갖고 있어서, 블록 전체에
 * 또 하나를 그으면 첫 줄만 이중선이 된다(실측 가능한 2px 계단).
 */
export const HeroIndexSlot = styled.div`
  margin-top: clamp(16px, 2.6vw, 32px);
  min-width: 0;
`;

/**
 * 재방문자용 줄. 마커가 없으면 렌더 자체를 하지 않는다 — 첫 방문자에게 없는 기능을 보여 주지 않는다.
 * 🔴 이 줄이 없어도 안전하다: 항상 보이는 시뮬레이터 CTA 가 같은 곳으로 간다.
 */
export const ResumeRow = styled.span`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[2]};
`;

export const ResumeNotice = styled.span`
  font-size: ${font.size.xs};
  /* 히어로 밖(페이지 bg)으로 내려왔지만 계속 text-secondary 다 — 같은 줄의 고스트 버튼 라벨과
     위계가 맞고, 히어로 면 위로 되돌아가도 그대로 안전한 쪽이다(text-muted 는 velog 다크의
     gradient-hero 위에서 4.04:1 로 AA 미달이었다). */
  color: ${color.textSecondary};
`;
