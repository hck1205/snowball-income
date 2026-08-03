import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { DATA_RADIUS, cardElevation, color, font, motion, radius, space } from '@/shared/styles';

/**
 * 히어로 **바로 아래**의 종목 검색(히어로 카드 안이 아니다 — `LandingPage.styled.ts` HeroExtras 참고).
 *
 * 🔴 **드롭다운 오버레이가 아니다.** 결과는 입력 바로 아래, 문서 흐름 안에 들어온다 —
 * 포털·position:absolute·백드롭·포커스 트랩이 하나도 없다. 랜딩에 role="dialog" 는 0개여야 한다.
 *
 * 왜 in-flow 인가: 팝업이면 지키지 않을 키보드 계약(위/아래 이동·Esc 닫기)을 선언하게 되고,
 * 모바일에서 가상 키보드가 뜨는 순간 겹침 계산이 무너진다. 결과가 6줄뿐이라 흐름에 넣어도
 * 첫 화면이 크게 밀리지 않는다(빈 입력일 때는 패널 자체를 렌더하지 않아 첫 로드 높이도 안 흔들린다).
 */

export const SearchRoot = styled.div`
  display: grid;
  /*
   * 🔴 간격을 0 으로 두고 **자식이 필요할 때만** margin 으로 띄운다(2026-08-02).
   *
   * 그전에는 grid gap 8px 이 항상 있었는데, 아래 상태 줄이 **비어 있어도 마운트는 유지**되므로
   * (라이브 리전이라 언마운트하면 이후 변경이 낭독되지 않는다) 그 8px 이 유령처럼 남아
   * 히어로 묶음의 아래 경계가 84px 이 됐다 — 나머지 그룹 경계는 전부 76px 이라 여기만 튀었다(실측).
   *
   * ⚠ 구 주석은 "있으나 없으나 같은 만큼 차지해 첫 화면 높이가 안 흔들린다"를 근거로 들었는데,
   *   실제로 값이 도착하면 그 아래 결과 패널이 통째로 나타나 훨씬 큰 이동이 일어난다 — 8px 이
   *   지켜 주던 것은 없었고 리듬만 깨고 있었다.
   */
  gap: 0;
  width: 100%;
  min-width: 0;
`;

/**
 * 🔴 폭 상한(구 `min(520px, 100%)`)을 두지 않는다 — 2026-08-02 사용자 결정.
 * 검색은 히어로 아래 **한 줄을 온전히 쓰는 요소**다. 상한이 있으면 넓은 화면에서 입력이 왼쪽에
 * 붙고 오른쪽이 비어, 아래 결과 패널과 폭이 어긋나 두 블록이 계단처럼 보였다.
 */
export const SearchForm = styled.form`
  display: block;
  width: 100%;
`;

/**
 * 🔴 **`<label>` 이다(`div` 아님).** 44px 상자 안에서 입력의 실제 높이는 한 줄(~20px)이라,
 * `div` 였을 때는 **위·아래 여백과 돋보기 아이콘을 눌러도 포커스가 가지 않았다** — 상자는 눌리는
 * 것처럼 보이는데 캐럿이 안 잡히는 클릭 미스다(2026-08-02 사용자 지적).
 *
 * `label` 로 바꾸면 상자 **전체**가 입력의 히트영역이 된다(패딩·아이콘·간격 포함). 이 레포가
 * `Toggle` 의 넓힌 히트영역이 클릭을 못 받던 결함을 고칠 때 쓴 것과 **같은 처방**이다.
 * ⚠ 라벨 안에 입력이 들어 있으므로 접근명은 안쪽의 시각 숨김 텍스트가 준다 — 그 텍스트를 빼면
 * 라벨이 이름 없는 라벨이 된다.
 */
export const SearchInputWrap = styled.label`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  /*
   * 56px — before 44px. 이 입력은 히어로 바로 아래 **한 줄을 온전히 쓰는 요소**이고, 랜딩에서
   * 히어로 CTA 다음으로 큰 컨트롤이다. 44px 이면 아래 차례 행(min-height 44px)과 같은 높이라
   * "누르는 것"과 "읽는 것"이 같은 무게로 보였다.
   */
  height: 56px;
  padding: 0 ${space[5]};
  /* 상자 전체가 텍스트 입력 자리임을 커서로도 말한다. */
  cursor: text;
  border: 1px solid ${color.borderStrong};
  /* 알약이다 — 고르는 면(카드 30~34px·CTA 알약)과 같은 어휘. 8px 사각 컨트롤만 각져 있으면 튄다. */
  border-radius: ${radius.pill};
  background: ${color.surface};
  /* 히어로에 딸린 줄이므로 페이지 정체색을 **글리프 하나로** 받는다(돋보기 아이콘).
     면과 테두리는 중립을 유지한다 - 컨트롤 경계를 장식 플로어 토큰으로 바꾸지 않는다. */
  color: ${color.identityText};
  transition: border-color ${motion.fast} ${motion.ease}, box-shadow ${motion.fast} ${motion.ease};

  /* 🔴 포커스 표시는 **상자**가 진다. 안쪽 input 은 전역 포커스 링을 끄고 있어서(아래 주석의
     사용자 결정) 이 선언이 없으면 키보드 사용자가 어디에 있는지 알 방법이 0 이 된다. */
  &:focus-within {
    border-color: ${color.identity};
    box-shadow: ${color.focusShadow};
  }

  svg {
    flex: none;
  }
`;

/**
 * 브라우저 기본 지우기(x) 버튼을 그대로 둔다 — 추가 지우기 버튼을 만들지 않는다.
 * 시각 라벨은 없고 시각 숨김 label 이 접근명을 준다(placeholder 는 접근명이 아니다).
 */
export const SearchInput = styled.input`
  flex: 1 1 auto;
  min-width: 0;
  /* 🔴 상자 높이를 세로로 채운다 — 한 줄 높이로만 서면 캐럿을 잡을 수 있는 띠가 44px 중 20px 뿐이다.
     바깥 label 이 클릭을 대신 받아 주지만, 입력 자체가 상자를 채워야 드래그 선택도 자연스럽다. */
  align-self: stretch;
  border: 0;
  background: transparent;
  font-family: ${font.sans};
  /* 상자가 56px 로 커졌으므로 글자도 한 단 올린다 — 14px 이 56px 상자 안에 있으면 비어 보인다. */
  font-size: ${font.size.lg};
  color: ${color.text};

  &::placeholder {
    color: ${color.textMuted};
  }

  /*
   * 🔴 전역 포커스 링을 이 입력에서만 끈다 (2026-08-02 사용자 결정 — 누를 때 테두리가 보이는 것을 원치 않음).
   *
   * globalStyles.ts 가 input:focus-visible 에 outline 2px + offset 2px + box-shadow 3px 를 건다.
   * 여기서 focus 만 잡아 outline:none 을 써도 안 꺼진다 — 전역 선택자가 더 구체적이라 이긴다.
   * 그래서 같은 의사클래스로 되받아 셋 다 명시적으로 지운다.
   * ⚠ 텍스트 입력은 마우스 클릭에도 focus-visible 이 매치된다(브라우저 기본 동작) — 그래서
   * "클릭할 때만 끄기"는 CSS 로 갈라낼 수 없다.
   *
   * ⚠ 대가: 이 필드는 키보드 포커스 표시가 없다(WCAG 2.4.7 미충족). 사용자가 알고 고른 것이고,
   * 되돌리려면 이 블록만 지우면 전역 링이 그대로 돌아온다. 다른 입력에 복사하지 마라.
   */
  &:focus,
  &:focus-visible {
    outline: none;
    box-shadow: none;
  }
`;

/**
 * 시각적으로만 숨긴다 — 접근성 트리에는 남아야 한다(display:none 은 이름을 지운다).
 *
 * 🔴 `label` 이 아니라 `span` 이다. 상자(`SearchInputWrap`)가 `label` 이 되면서 입력을 감싸므로,
 * 여기까지 `label` 이면 **한 입력에 라벨이 둘**이 되어 접근명이 이어 붙는다. 이 노드는 그 라벨
 * **안에서 텍스트를 대는 역할**만 하고, `role="search"` 폼의 `aria-labelledby` 대상이기도 하다.
 */
export const VisuallyHiddenLabel = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`;

/**
 * 🔴 이 노드는 **처음부터 끝까지 마운트 상태를 유지**하고 텍스트만 바뀐다.
 * 조건부 언마운트하면 그 뒤의 변경이 스크린리더에 낭독되지 않는다(라이브 리전의 고전적 함정).
 */
export const SearchStatus = styled.p`
  margin: 0;

  /* 문구가 있을 때만 위 여백을 갖는다 — 비면 자리도 간격도 0 이다(SearchRoot 주석 참고). */
  &:not(:empty) {
    margin-top: ${space[2]};
  }
  font-family: ${font.sans};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
  /* text-muted 를 쓰지 않는다 — velog 다크의 히어로 면(gradient-hero) 위에서 4.04:1 로 AA 미달이었고,
     이 블록은 히어로 안팎을 오갈 수 있는 자리라 더 진한 쪽으로 고정한다. */
  color: ${color.textSecondary};
  /* 🔴 비어 있을 때 display:none 으로 접지 마라 — 숨겨진 라이브 리전은 보조기술이 무시한다.
     내용이 없으면 높이가 0이고, 남는 것은 그리드 간격 하나뿐이라 첫 화면 높이가 흔들리지 않는다
     (있으나 없으나 **항상 같은 만큼** 차지한다는 것이 요점이다). */
`;

/**
 * 결과 패널 — **빈 상태가 이 부품의 얼굴이다.**
 *
 * 이 앱의 소개 페이지는 11종뿐이라 "테슬라"·"카카오뱅크" 같은 검색은 **평범하게 자주** 무결과가
 * 된다. 그때 화면이 초라하면 앱 전체가 초라해 보인다 — 그래서 무결과 경로도 결과 경로와 **같은
 * 패널·같은 행 어휘**를 쓰고, 사유 문장 + 갈 곳 셋 + 다음 행동 힌트가 함께 선다.
 *
 * ⚠ 구조 계약: 폴백 제목(`ResultNote`)의 **부모**가 링크들을 담고 있어야 한다
 * (`test/landing/landingSearch.test.tsx` 가 `getByText(fallbackTitle).parentElement` 로 패널을 잡는다).
 * 제목만 따로 감싸지 마라.
 */
export const ResultPanel = styled.div`
  /* 결과 패널은 나타날 때만 존재하므로 자기 위 여백을 스스로 갖는다(SearchRoot 의 gap 은 0). */
  margin-top: ${space[3]};
  display: grid;
  gap: ${space[3]};
  /* 입력과 **같은 폭**이어야 한다 — 어긋나면 결과가 다른 블록처럼 읽힌다. */
  width: 100%;
  padding: clamp(16px, 2vw, 24px);
  /* 읽는 면(data)의 반경 — 이 패널은 고르는 카드가 아니라 목록이다. */
  border-radius: ${DATA_RADIUS};
  ${cardElevation('base')}
`;

export const ResultList = styled.ul`
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
`;

/** 행 높이 52px 균일 + 1px 룰 구분 — 목록은 줄이 있어야 목록으로 읽힌다(gap 만으로는 떠 있다). */
export const ResultLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${space[4]};
  min-height: 52px;
  padding: 0 ${space[3]};
  margin: 0 -${space[3]};
  border-radius: ${radius.md};
  text-decoration: none;
  color: ${color.text};
  transition: background-color ${motion.fast} ${motion.ease};

  li + li > & {
    border-top: 1px solid ${color.border};
    border-radius: 0;
  }

  &:hover {
    background: ${color.surfaceHover};
  }

  svg {
    flex: none;
    margin-left: auto;
    color: ${color.textMuted};
  }

  &:hover svg {
    color: ${color.brand};
  }
`;

/** 심볼 열 6ch 고정폭 — 이름 시작선이 행마다 흔들리지 않는다(캘린더 티커 열과 같은 규칙). */
export const ResultSymbol = styled.span`
  flex: 0 0 auto;
  width: 6ch;
  font-family: ${font.dataNumeric};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
  ${font.numeric}
`;

export const ResultName = styled.span`
  min-width: 0;
  font-size: ${font.size.base};
  color: ${color.textSecondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/**
 * 패널 안 안내 문장(폴백 제목 · 다음 행동 힌트).
 * 🔴 이 요소의 **부모가 곧 패널**이어야 한다 — 위 ResultPanel 주석의 구조 계약.
 */
export const ResultNote = styled.p`
  margin: 0;
  font-family: ${font.sans};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.snug};
  color: ${color.text};

  /* 두 번째 안내(다음 행동 힌트)는 제목이 아니라 각주다 — 같은 부품이 자리로 무게를 가른다. */
  & ~ & {
    font-weight: ${font.weight.regular};
    color: ${color.textSecondary};
  }
`;

export const ResultHubLink = styled(Link)`
  justify-self: start;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.brand};
`;
