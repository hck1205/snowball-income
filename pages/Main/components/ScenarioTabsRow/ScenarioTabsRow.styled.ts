import styled from '@emotion/styled';
import { color } from '@/shared/styles';

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
