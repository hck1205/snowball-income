import styled from '@emotion/styled';
import { color, media, space } from '@/shared/styles';

/**
 * 고정된 설정 버튼이 이 줄의 오른쪽 끝에 앉을 자리 — **아이콘 40px + 숨구멍 8px**.
 *
 * 40px 은 `Button` 의 `size="md"` + `iconOnly` 정사각 크기다(`Button.styled.ts` 의 `SIZE.md.icon`).
 * 그 값은 export 되지 않아 여기서 다시 적는다 — **한 쌍이므로 한쪽만 바꾸면 어긋난다**(아이콘이 커지면
 * 탭이 그 밑으로 들어가고, 작아지면 오른쪽에 빈 띠가 남는다).
 */
const PINNED_SETTINGS_RESERVE = `calc(40px + ${space[2]})`;

/**
 * 시나리오 탭 줄 = **결과 보드의 머리**.
 *
 * 🔴 밑줄(`border-bottom`)은 **탭 스트립이 아니라 이 래퍼**가 갖는다. 스트립에 두면 스트립 폭
 * (= 탭 개수만큼)까지만 선이 그려져 오른쪽이 끊긴다. 이 선은 지금 보드의 머리와 본문을 가르는
 * 경계선이기도 하다 — `ResultBoard` 의 머리 슬롯은 아래 패딩이 0 이라 이 선이 곧 경계다.
 *
 * 2026-08-03: 왼쪽 이름표("시나리오")를 **뺐다**(사용자 지시). 그 글자는 `aria-hidden` 이라 애초에
 * 낭독 대상이 아니었고(스트립이 aria-label 로 이미 이름을 갖는다), 이름이 붙은 탭 옆에 "시나리오"를
 * 또 적는 것은 같은 말을 두 번 하는 것이었다. 아이콘으로 바꾸는 안도 기각했다 — "시나리오"를 뜻하는
 * 관습적 글리프가 없어 뜻을 못 하는 장식이 하나 더 늘 뿐이다.
 * ⚠ 되살리려면 이 줄이 **좁은 폭에서 가장 먼저 눌리는 자리**라는 것을 먼저 보라(파일 상단 이력).
 */
export const TabsRowRoot = styled.div`
  display: flex;
  align-items: flex-end;
  border-bottom: 1px solid ${color.border};
  min-width: 0;

  /*
   * 🔴 오른쪽 끝에 **고정된 설정 아이콘의 자리를 비워 둔다** (2026-08-17 사용자 지시:
   * "탭들의 wrapper width 를 setting 아이콘 보일 만큼만 지정해라").
   * ⚠ 주석에 백틱 금지 — Emotion 템플릿 리터럴 안이다.
   *
   * 왜 필요한가: 스크롤하면 설정 버튼이 톱니 아이콘만 남아 이 줄과 **같은 띠의 우측 끝**에 고정된다
   * (useStickyHeroAction). 자리를 비워 두지 않으면 탭이 많을 때 스트립이 그 아이콘 **밑까지** 늘어나,
   * 스크롤을 끝까지 밀어도 마지막 탭이 아이콘에 가려 읽히지 않는다.
   *
   * 이 여백은 **항상** 있다(고정 상태에서만 켜지 않는다): 탭이 넘치지 않는 평상시에는 스트립이 남는
   * 폭을 다 쓰지 않으므로 화면에 아무 변화가 없고, 반대로 켜고 끄면 고정되는 순간 탭들이 48px 옆으로
   * 밀려 흔들린다. 넘칠 때만 효과가 드러나는 여백이 조용한 쪽이다.
   *
   * 밑줄(border-bottom)은 이 여백을 **가로질러 그대로 간다** — 테두리는 패딩 밖이라 봉합선이 짧아지지
   * 않는다(그 선은 결과 영역의 끝선과 맞아야 한다 — ResultBoard 머리말).
   * 경계는 바가 실제로 붙는 구간과 같다(mobileWide 이하에서는 이 줄이 고정되지 않으므로 자리도 필요 없다).
   */
  ${media.up('mobileWide')} {
    padding-right: ${PINNED_SETTINGS_RESERVE};
  }
`;

/** 탭 스트립이 남는 가로를 전부 먹는다(스트립 자체가 가로 스크롤이라 줄바꿈이 필요 없다). */
export const TabsRowStrip = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`;

/*
 * 구 `RowActions` · `CompactToggleSlot`(탭 스트립 오른쪽의 컨트롤 묶음)은 없다 — 그 안에 있던
 * "간략히"·"이미지 저장"이 2026-07-29 에 각자의 자리로 옮겨간 뒤로 **소비처가 0** 인 채 남아
 * 있었다. 다시 필요해지면 그때의 컨트롤에 맞춰 새로 쓴다.
 */
