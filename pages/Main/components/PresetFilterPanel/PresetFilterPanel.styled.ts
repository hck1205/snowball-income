import styled from '@emotion/styled';
import { color, font, media, motion, radius, shadow, space } from '@/shared/styles';

/*
 * 색 규율: 시맨틱 토큰만. 상태(isActive/isOpen/active)는 prop 기반 styled 로 분기한다 —
 * Emotion 컴포넌트 셀렉터는 이 레포 테스트 변환에서 throw 라 금지. 커스텀 prop 이름은
 * 유효 HTML 어트리뷰트(open/active 등)를 피해 transient 성격으로 짓는다.
 *
 * UX 모델(2026-07-22): 접이식 패널 → 검색행 우측 아이콘 트리거 + 모달 우측 슬라이드 드로어.
 * 드로어는 스크롤되는 ModalPanel 이 아니라 그 밖의 relative 셸(ModalShell, TickerModal 뷰)에
 * absolute 로 핀돼 패널 스크롤과 무관하게 가시 박스에 고정된다.
 */

/* -------------------------------------------------------------------------- */
/* A. 트리거 (검색행 우측 아이콘 버튼)                                          */
/* -------------------------------------------------------------------------- */

/** 검색 입력 우측에 겹쳐 앉는 필터 아이콘 버튼. 활성/열림 시 brand 톤. */
export const PresetFilterTriggerButton = styled.button<{ isActive: boolean; isOpen: boolean }>`
  position: absolute;
  right: ${space[1]};
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  border-radius: ${radius.sm};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px solid ${({ isActive, isOpen }) => (isActive || isOpen ? color.brandBorder : color.borderStrong)};
  background: ${({ isActive, isOpen }) => (isActive || isOpen ? color.brandSubtle : color.surface)};
  color: ${({ isActive, isOpen }) => (isActive || isOpen ? color.brandText : color.textSecondary)};
  transition: border-color ${motion.fast} ${motion.ease}, background ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  svg {
    display: block;
  }

  &:hover {
    border-color: ${color.brandBorder};
  }

  &:focus-visible {
    outline: none;
    border-color: ${color.focusRing};
    box-shadow: 0 0 0 3px ${color.focusShadow};
  }
`;

/** 활성 필터 개수 배지 — brand 채움 위 라벨은 onBrand. 트리거 우상단에 겹친다. */
export const Badge = styled.span`
  position: absolute;
  top: -5px;
  right: -5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: ${radius.pill};
  background: ${color.brand};
  color: ${color.onBrand};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  line-height: 1;
  ${font.numeric}
`;

/* -------------------------------------------------------------------------- */
/* B. 상태줄 (검색행 아래, 닫힌 상태에서도 노출)                                 */
/* -------------------------------------------------------------------------- */

export const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  margin-bottom: ${space[2]};
`;

/** brand 점 — "필터 적용 중" 표식. */
export const StatusDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: ${radius.pill};
  background: ${color.brand};
  flex: none;
`;

export const StatusText = styled.span`
  color: ${color.brandText};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
`;

export const ResetButton = styled.button`
  margin-left: auto;
  border: 0;
  background: transparent;
  padding: ${space[1]} ${space[2]};
  color: ${color.textMuted};
  font-family: inherit;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  cursor: pointer;
  border-radius: ${radius.sm};

  &:hover {
    color: ${color.brandText};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px ${color.focusShadow};
  }
`;

/** 닫힌 상태에서도 보이는 활성 필터 태그 줄(제거형 칩). */
export const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
  margin-bottom: ${space[3]};
`;

/* -------------------------------------------------------------------------- */
/* C. 드로어 (셸의 absolute 형제 — 패널 스크롤에 안 밀림)                        */
/* -------------------------------------------------------------------------- */

/** 드로어와 함께 마운트되는 반투명 막. 클릭 → 드로어만 닫음. */
export const Scrim = styled.div`
  position: absolute;
  inset: 0;
  background: ${color.overlay};
  /* 셸을 꽉 채우는 사각형이라, 모달 패널의 둥근 코너(radius.lg)와 실루엣을 맞추지 않으면
     각진 코너가 둥근 모달 밖으로 삐져나와 코너에 어두운 사각형으로 보인다. */
  border-radius: ${radius.lg};
  z-index: 1;

  @media (prefers-reduced-motion: no-preference) {
    animation: sb-scrim-in ${motion.fast} ${motion.ease};
  }

  @keyframes sb-scrim-in {
    from {
      opacity: 0;
    }
  }
`;

export const Drawer = styled.aside`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(340px, calc(100% - ${space[10]}));
  background: ${color.surface};
  border-left: 1px solid ${color.border};
  border-top-right-radius: ${radius.lg};
  border-bottom-right-radius: ${radius.lg};
  box-shadow: ${shadow.e3};
  display: flex;
  flex-direction: column;
  z-index: 2;
  overflow: hidden;

  @media (prefers-reduced-motion: no-preference) {
    animation: sb-drawer-in ${motion.base} ${motion.ease};
  }

  @keyframes sb-drawer-in {
    from {
      transform: translateX(100%);
    }
  }

  ${media.down('mobileWide')} {
    width: 100%;
  }
`;

export const DrawerHeader = styled.header`
  padding: ${space[4]};
  border-bottom: 1px solid ${color.border};
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const DrawerTitle = styled.h4`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
`;

export const DrawerCloseButton = styled.button`
  width: 30px;
  height: 30px;
  border-radius: ${radius.sm};
  border: 1px solid transparent;
  background: transparent;
  color: ${color.textSecondary};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color ${motion.fast} ${motion.ease}, background ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  svg {
    display: block;
  }

  &:hover {
    border-color: ${color.brandBorder};
    color: ${color.brandText};
  }

  &:focus-visible {
    outline: none;
    border-color: ${color.focusRing};
    box-shadow: 0 0 0 3px ${color.focusShadow};
  }
`;

export const DrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${space[4]};
  display: flex;
  flex-direction: column;
  gap: ${space[4]};

  scrollbar-width: thin;
  scrollbar-color: ${color.border} transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${color.border};
    border-radius: ${radius.pill};
  }
`;

export const DrawerFooter = styled.footer`
  padding: ${space[4]};
  border-top: 1px solid ${color.border};
  flex: none;
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
`;

/** 결과 카운트 + 초기화가 한 줄에 앉는 푸터 상단 행. */
export const FooterInfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[3]};
`;

/* -------------------------------------------------------------------------- */
/* 드로어 내부 컨트롤 (구 Panel 내용 이관, 스타일 불변)                          */
/* -------------------------------------------------------------------------- */

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[2]};
  min-width: 0;
`;

export const FieldLabel = styled.span`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
`;

export const FrequencyRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
`;

/** 주기 멀티토글 칩(공용 Chip 은 aria-pressed 를 노출하지 않아 로컬 토글로 둔다). */
export const FrequencyChip = styled.button<{ active: boolean }>`
  min-height: 32px;
  padding: 0 ${space[3]};
  border-radius: ${radius.pill};
  border: 1px solid ${({ active }) => (active ? color.brandBorder : color.border)};
  background: ${({ active }) => (active ? color.brandSubtle : color.surface)};
  color: ${({ active }) => (active ? color.brandText : color.textSecondary)};
  font-family: inherit;
  font-size: ${font.size.xs};
  font-weight: ${({ active }) => (active ? font.weight.bold : font.weight.medium)};
  cursor: pointer;
  touch-action: manipulation;
  transition: border-color ${motion.fast} ${motion.ease}, background ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.brandBorder};
  }

  &:focus-visible {
    outline: none;
    border-color: ${color.focusRing};
    box-shadow: 0 0 0 3px ${color.focusShadow};
  }
`;

export const ResultCount = styled.span`
  font-size: ${font.size.sm};
  color: ${color.textSecondary};
  font-weight: ${font.weight.medium};
  ${font.numeric}
`;

export const EmptyNote = styled.span`
  font-size: ${font.size.sm};
  color: ${color.textMuted};
  line-height: ${font.leading.normal};
`;
