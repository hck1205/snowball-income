import styled from '@emotion/styled';
import { DATA_RADIUS, color, font, media, motion, radius, space } from '@/shared/styles';

/* ── 위험 영역 ─────────────────────────────────────────────────────────────── */

/** 라벨이 붙은 구분선 — "여기서부터 성격이 다르다"를 형태가 먼저 말한다. */
export const DangerLabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  color: ${color.danger};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.14em;
  text-transform: uppercase;

  &::after {
    content: '';
    flex: 1 1 auto;
    height: 1px;
    background: ${color.dangerBorder};
  }
`;

export const DangerZone = styled.section`
  display: grid;
  gap: ${space[3]};
`;

/**
 * 위험 영역 카드 — 이 앱에서 danger 면이 합법인 **유일한 자리**다.
 *
 * 🔴 면은 **헤더 띠에만** 깐다. 카드 전체를 dangerSurface 로 채우면 공용 `Button variant="danger"`
 *    가 같은 면색(dangerSurface)이라 패널 안에서 **버튼이 배경에 잠긴다**(2026-08-03 실측).
 *    경보(헤더 = danger 면) / 읽고 행동하는 자리(패널 = 중립 면)로 층을 갈라 둔다.
 */
export const DangerAccordion = styled.div`
  border-radius: ${DATA_RADIUS};
  border: 1px solid ${color.dangerBorder};
  background: ${color.surface};
  overflow: hidden;
`;

export const DangerHeader = styled.button`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  width: 100%;
  padding: ${space[4]} clamp(${space[4]}, 2vw, ${space[5]});
  border: 0;
  background: ${color.dangerSurface};
  text-align: left;
  cursor: pointer;
  transition: background-color ${motion.fast} ${motion.ease};

  &:hover {
    background: color-mix(in srgb, ${color.danger} 12%, ${color.surface});
  }

  &:focus-visible {
    outline: 2px solid ${color.danger};
    outline-offset: -2px;
  }
`;

export const DangerGlyph = styled.span`
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: ${radius.md};
  color: ${color.danger};
  border: 1px solid ${color.dangerBorder};
  background: ${color.surface};
`;

export const DangerHeaderText = styled.span`
  display: grid;
  gap: ${space[1]};
  flex: 1 1 auto;
  min-width: 0;
`;

/** 아코디언 헤더 제목 — heading 이 아니라 span(button 안에 heading 금지). */
export const DangerTitle = styled.span`
  color: ${color.danger};
  font-family: ${font.display};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
`;

/** 접힘 상태에서도 위험 맥락(삭제 범위)이 읽히도록 헤더에 캡션을 상시 노출. */
export const DangerCaption = styled.span`
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
  word-break: keep-all;
`;

export const Chevron = styled.span<{ open: boolean }>`
  display: inline-flex;
  flex: 0 0 auto;
  color: ${color.danger};
  transition: transform ${motion.base} ${motion.ease};
  transform: rotate(${({ open }) => (open ? '180deg' : '0deg')});
`;

/**
 * 펼침 애니메이션: grid-template-rows 0fr↔1fr (높이 하드코딩 없이 콘텐츠 실측 높이로 확장).
 * 접힘 시 내부(> div)를 visibility:hidden 으로 접근성 트리·탭 순서에서 제거 → Tab 이 탈퇴 버튼을 건너뛴다.
 * 닫힐 때는 접힘 완료(motion.base) 후 숨긴다. prefers-reduced-motion 은 globalStyles 전역 리셋이 스냅 처리.
 */
export const DangerPanel = styled.div`
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows ${motion.base} ${motion.ease};

  &[data-open='true'] {
    grid-template-rows: 1fr;
  }

  > div {
    visibility: hidden;
    transition: visibility 0s linear ${motion.base};
  }

  &[data-open='true'] > div {
    visibility: visible;
    transition: visibility 0s;
  }
`;

export const DangerPanelInner = styled.div`
  overflow: hidden; /* 0fr 구간에서 콘텐츠를 잘라낸다 */
  min-height: 0;
`;

export const DangerPanelBody = styled.div`
  display: grid;
  gap: ${space[4]};
  padding: ${space[5]} clamp(${space[4]}, 2vw, ${space[5]});
  border-top: 1px solid ${color.dangerBorder};
`;

/**
 * 삭제 범위 — 구 화면은 펼쳐도 버튼 하나뿐이라 "무엇이 사라지는지"를 다이얼로그에서야 알았다.
 * 흰 면 위에 올려 danger 면과 위계를 갈라 놓는다(읽을 것 / 위험한 것).
 */
export const DangerScopeCard = styled.div`
  display: grid;
  gap: ${space[2]};
  padding: ${space[4]};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
`;

export const DangerScopeIntro = styled.p`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
`;

export const DangerScopeList = styled.ul`
  display: grid;
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: flex-start;
    gap: ${space[2]};
    color: ${color.textSecondary};
    font-size: ${font.size.sm};
    line-height: ${font.leading.normal};
    word-break: keep-all;
  }

  li::before {
    content: '';
    flex: 0 0 auto;
    width: 5px;
    height: 5px;
    margin-top: 7px;
    border-radius: ${radius.pill};
    background: ${color.danger};
  }
`;

export const DangerIrreversible = styled.p`
  display: flex;
  align-items: flex-start;
  gap: ${space[2]};
  margin: 0;
  color: ${color.danger};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  word-break: keep-all;
`;

export const DangerActions = styled.div`
  display: flex;
  justify-content: flex-start;

  ${media.down('mobileWide')} {
    > * {
      flex: 1 1 auto;
    }
  }
`;
