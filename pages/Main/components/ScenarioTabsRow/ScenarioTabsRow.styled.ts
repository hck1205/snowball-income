import styled from '@emotion/styled';
import { color, font, media, space } from '@/shared/styles';

/**
 * 시나리오 탭 줄 = **결과 보드의 머리**.
 *
 * 🔴 밑줄(`border-bottom`)은 **탭 스트립이 아니라 이 래퍼**가 갖는다. 스트립에 두면 스트립 폭
 * (= 탭 개수만큼)까지만 선이 그려져 오른쪽이 끊긴다. 이 선은 지금 보드의 머리와 본문을 가르는
 * 경계선이기도 하다 — `ResultBoard` 의 머리 슬롯은 아래 패딩이 0 이라 이 선이 곧 경계다.
 *
 * 2026-08-03: 이름표(`TabsRowLabel`)가 왼쪽에 붙었다. 예전에는 탭 몇 개가 아무 설명 없이 떠 있어서
 * "이게 무엇을 전환하는 것인가"를 눌러 봐야 알았다. 이름표는 좁은 폭에서 사라진다 — 그 폭에서는
 * 탭이 쓸 가로가 더 급하고, 보드 안이라는 맥락은 이미 형태가 말한다.
 */
export const TabsRowRoot = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${space[3]};
  border-bottom: 1px solid ${color.border};
  min-width: 0;
`;

/**
 * 줄 이름표. 탭의 활성 채움과 경쟁하면 안 되므로 **가장 낮은 무게**(11px · muted · 자간 확장)로 둔다.
 * `padding-bottom` 은 40px 짜리 탭의 아래 기준선에 글자를 맞추기 위한 값이다.
 */
export const TabsRowLabel = styled.p`
  flex: 0 0 auto;
  margin: 0;
  padding-bottom: ${space[3]};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.1em;
  line-height: ${font.leading.snug};
  color: ${color.textMuted};

  ${media.down('tabletSm')} {
    display: none;
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
