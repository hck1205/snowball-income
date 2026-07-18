import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/**
 * 프로필 페이지 컨테이너. 제목 + 닉네임 카드 + 회원 탈퇴 아코디언을 담는 **단일 세로 컬럼**.
 * (v2에서 프로필 사진 제거로 2단 그리드가 사라졌다. 로그인 게이트 `GateWrap`과 동일 폭.)
 */
export const ProfileMain = styled.div`
  max-width: 480px;
  margin: 0 auto;
  display: grid;
  gap: ${space[5]};
`;

export const PageTitle = styled.h1`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size['2xl']};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
`;

/** Card풍 섹션 — surface + border + radius.lg (도구 카드 관례). */
export const Section = styled.section`
  display: grid;
  gap: ${space[4]};
  padding: ${space[5]};
  border-radius: ${radius.lg};
  border: 1px solid ${color.border};
  background: ${color.surface};
`;

export const SectionTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
`;

/* ── 닉네임 폼 (Write 페이지 입력 언어를 따른다) ─────────────────────────── */

export const FieldBlock = styled.div`
  display: grid;
  gap: ${space[2]};
`;

export const LabelRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[2]};
`;

export const FieldLabel = styled.label`
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
`;

export const Counter = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  ${font.numeric}
`;

/** velog식 언더라인 입력 — invalid 시 언더라인이 danger(검증된 대비)로 바뀐다. */
export const NicknameInput = styled.input<{ invalid?: boolean }>`
  width: 100%;
  height: 44px;
  padding: 0 ${space[1]};
  border: none;
  border-bottom: 1px solid ${({ invalid }) => (invalid ? color.danger : color.border)};
  border-radius: 0;
  background: transparent;
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.semibold};

  &::placeholder {
    color: ${color.textMuted};
    font-weight: ${font.weight.regular};
  }
`;

export const Hint = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
`;

export const FieldError = styled.p`
  margin: 0;
  color: ${color.danger};
  font-size: ${font.size.sm};
`;

/** 상태 피드백이 같은 부모 안에서 교체되도록 감싼다(aria-live 안정). */
export const Feedback = styled.div`
  display: grid;
  gap: ${space[1]};
  min-height: 20px;
`;

export const SuccessText = styled.p`
  display: flex;
  align-items: center;
  gap: ${space[1]};
  margin: 0;
  color: ${color.success};
  font-size: ${font.size.sm};
`;

export const SaveRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

/* ── 위험 영역(회원 탈퇴) — 기본 접힘 아코디언. 빨간 프레임 금지, 중립 보더 + danger 톤 텍스트 ── */

export const DangerAccordion = styled.section`
  border-radius: ${radius.lg};
  border: 1px solid ${color.border};
  background: ${color.surface};
  overflow: hidden; /* radius 안쪽으로 헤더 hover 배경을 클립 */
`;

/** 디스클로저 헤더 = 네이티브 button. Enter/Space 토글은 버튼 기본 동작(추가 핸들러 불요). */
export const DangerHeader = styled.button`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  width: 100%;
  padding: ${space[4]} ${space[5]}; /* min-height ≥ 44px 확보 */
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background-color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: -2px;
  }
`;

export const DangerHeaderText = styled.span`
  display: grid;
  gap: ${space[1]};
  flex: 1 1 auto;
  min-width: 0;
`;

/** 아코디언 헤더 제목 — heading이 아니라 span(button 안에 heading 금지). danger 톤. */
export const DangerTitle = styled.span`
  color: ${color.danger};
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
`;

/** 접힘 상태에서도 위험 맥락(삭제 범위)이 읽히도록 헤더에 캡션을 상시 노출. */
export const DangerCaption = styled.span`
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
`;

export const Chevron = styled.span<{ open: boolean }>`
  display: inline-flex;
  flex: 0 0 auto;
  color: ${color.textMuted};
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
  gap: ${space[3]};
  padding: ${space[4]} ${space[5]} ${space[5]};
  border-top: 1px solid ${color.border}; /* 헤더와 패널 구분선(접힘 시 함께 클립됨) */
`;

export const DangerActions = styled.div`
  display: flex;
  justify-content: flex-start;
`;

/* ── 로그인 게이트 (Write 페이지 선례) ─────────────────────────────────── */

export const GateWrap = styled.div`
  max-width: 480px;
  margin: clamp(${space[6]}, 8vw, ${space[16]}) auto 0;
`;

/** 프로바이더 버튼 세로 스택. 버튼 자체는 공용 `SocialLoginButton`(브랜드 규정색·로고·카피). */
export const GateButtons = styled.div`
  display: grid;
  gap: ${space[2]};
  margin-top: ${space[4]};
`;
