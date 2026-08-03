import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import {
  DATA_RADIUS,
  PICK_RADIUS,
  brandPanel,
  color,
  elevation,
  font,
  heroTitleFontSize,
  media,
  motion,
  radius,
  sectionTitleFontSize,
  space
} from '@/shared/styles';

/* ==========================================================================
   계정 콘솔 셸 — 좌측 아이덴티티 레일 + 우측 작업 영역
   --------------------------------------------------------------------------
   구 구조는 480px 단일 컬럼에 흰 카드 두 장을 세로로 쌓은 것이었다. 그 화면에서 가장 큰
   글자가 20px h1 이라 "무엇을 하는 화면인지"를 말하는 것이 아무것도 없었고, 프로필 설정과
   내가 쓴 글은 서로를 모르는 남남이었다(헤더 드롭다운으로만 오간다).

   새 구조는 **계정 콘솔**이다. 좌측 네이비 레일이 이 화면의 정체(내 계정)와 두 자매 화면의
   전환을 상시 들고 있고, 우측이 실제 작업 영역이다. 981px 미만에서는 레일이 위로 접히며
   가로 띠가 된다 — 순서(정체 → 작업)는 두 폭에서 같다.

   ⚠ 이 파일과 CommunityMyPostsPage.styled.ts 는 **같은 값을 각자 소유**한다(레일 기하·간격).
     페이지 styled 를 가로질러 import 하지 않는 이 레포 관례를 그대로 따른다.
   ========================================================================== */

export const ConsoleRoot = styled.div`
  max-width: 1040px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(${space[5]}, 3vw, ${space[8]});
  align-items: start;

  ${media.up('layout')} {
    grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
  }
`;

/** 상단 바("← 목록")는 콘솔 전체 폭을 쓴다 — 레일 안에 들어가면 되돌아가기가 숨는다. */
export const TopBarSlot = styled.div`
  ${media.up('layout')} {
    grid-column: 1 / -1;
  }
`;

/* ── 아이덴티티 레일 (brand 면 · 이 화면의 유일한 반전 면) ─────────────────── */

export const IdentityRail = styled.aside`
  ${brandPanel()}
  border-radius: ${PICK_RADIUS};
  padding: clamp(${space[5]}, 2.4vw, ${space[7]});
  display: grid;
  gap: ${space[4]};
`;

/** 하마 글리프 자리. 금색은 이 네이비 면 위에서만 합법이다(밝은 면 위 1.83:1). */
export const RailGlyph = styled.span`
  display: inline-grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: ${radius.lg};
  color: ${color.onPanelGold};
  border: 1px solid color-mix(in srgb, ${color.onPanelGold} 34%, transparent);
  background: color-mix(in srgb, ${color.onPanelGold} 10%, transparent);
`;

export const RailEyebrow = styled.p`
  margin: 0;
  color: ${color.onPanelGold};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.14em;
  text-transform: uppercase;
`;

/** 화면 이름 = h1. 레일이 제목을 진다 — 작업 영역은 곧바로 내용으로 시작한다. */
export const RailTitle = styled.h1`
  margin: ${space[1]} 0 0;
  color: ${color.onPanel};
  font-family: ${font.display};
  font-size: ${heroTitleFontSize};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

export const RailLead = styled.p`
  margin: ${space[2]} 0 0;
  color: ${color.onPanelMuted};
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  word-break: keep-all;
`;

/** 금색 헤어라인 — 이 면 위에서만 존재할 수 있는 구분선. */
export const RailDivider = styled.hr`
  height: 1px;
  margin: 0;
  border: 0;
  background: color-mix(in srgb, ${color.onPanelGold} 32%, transparent);
`;

export const RailNav = styled.nav`
  display: grid;
  gap: ${space[1]};
`;

/**
 * 두 자매 화면(프로필 설정 ↔ 내가 쓴 글)의 전환. 현재 화면은 aria-current 로 말하고,
 * 시각적으로도 금색 좌측 표식 + 굵기로 말한다(색 단독 채널 금지).
 */
export const RailNavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  min-height: 44px;
  padding: 0 ${space[3]};
  border-radius: ${radius.md};
  border-left: 3px solid transparent;
  color: ${color.onPanelMuted};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  text-decoration: none;
  transition:
    background-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:hover {
    background: color-mix(in srgb, ${color.onPanel} 10%, transparent);
    color: ${color.onPanel};
  }

  &:focus-visible {
    outline: 2px solid ${color.onPanelGold};
    outline-offset: 2px;
  }

  &[aria-current='page'] {
    background: color-mix(in srgb, ${color.onPanel} 14%, transparent);
    border-left-color: ${color.onPanelGold};
    color: ${color.onPanel};
    font-weight: ${font.weight.bold};
  }
`;

/* ── 작업 영역 ─────────────────────────────────────────────────────────────── */

export const ConsoleBody = styled.div`
  display: grid;
  gap: clamp(${space[5]}, 2.4vw, ${space[7]});
  min-width: 0;
`;

/**
 * 편집 카드 = 읽고 쓰는 면(data). 색면을 얹지 않고 **좌측 4px 액센트 귀**(L1)로만 말한다 —
 * 이 화면의 색 예산 2면은 레일과 위험 영역이 이미 쓴다.
 */
export const Section = styled.section`
  position: relative;
  display: grid;
  gap: ${space[5]};
  padding: clamp(${space[5]}, 2.2vw, ${space[7]});
  padding-left: calc(clamp(${space[5]}, 2.2vw, ${space[7]}) + 4px);
  border-radius: ${DATA_RADIUS};
  border: 1px solid ${color.border};
  background: ${color.surface};
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 4px;
    background: ${color.accent};
  }
`;

export const SectionHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  min-width: 0;
`;

export const SectionGlyph = styled.span`
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: ${radius.md};
  color: ${color.accentText};
  background: color-mix(in srgb, ${color.accent} 12%, ${color.surface});
`;

export const SectionTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-family: ${font.display};
  font-size: ${sectionTitleFontSize};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
`;

/* ── 표시 이름 미리보기 — 입력이 바뀌면 여기가 즉시 따라 바뀐다 ──────────────── */

/**
 * "저장 전에 결과를 본다." 구 화면은 입력칸 하나만 있어서 무엇이 어떻게 보일지 알 수 없었다.
 * 중립 면(sunken)이라 색 예산을 쓰지 않는다.
 */
export const PreviewCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  padding: ${space[3]} ${space[4]};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
  border: 1px dashed ${color.border};
  min-width: 0;
`;

export const PreviewGlyph = styled.span`
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  border-radius: ${radius.pill};
  color: ${color.identityText};
  background: ${color.identitySubtle};
`;

export const PreviewTexts = styled.span`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const PreviewName = styled.strong`
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const PreviewCaption = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
`;

/* ── 닉네임 폼 ─────────────────────────────────────────────────────────────── */

export const FieldBlock = styled.div`
  display: grid;
  gap: ${space[3]};
`;

export const LabelRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[2]};
`;

export const FieldLabel = styled.label`
  color: ${color.textSecondary};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

/** 글자 수는 캡션이 아니라 **알약 계기**다 — 상한이 가까워지는 것이 형태로 보인다. */
export const Counter = styled.span<{ near: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  border: 1px solid ${({ near }) => (near ? color.warning : color.border)};
  color: ${({ near }) => (near ? color.warning : color.textMuted)};
  background: ${color.surface};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  ${font.numeric}
`;

/**
 * 입력은 이 카드의 주역이라 **본문보다 두 단 크다**(구 16px → 24px 대역).
 * 언더라인 두께도 1px → 2px 로 올려 "여기를 고친다"가 형태로 읽히게 한다.
 */
export const NicknameInput = styled.input<{ invalid?: boolean }>`
  width: 100%;
  height: 56px;
  padding: 0 ${space[1]};
  border: none;
  border-bottom: 2px solid ${({ invalid }) => (invalid ? color.danger : color.borderStrong)};
  border-radius: 0;
  background: transparent;
  color: ${color.text};
  font-family: ${font.display};
  font-size: ${font.size['3xl']};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
  transition: border-color ${motion.fast} ${motion.ease};

  &::placeholder {
    color: ${color.textMuted};
    font-weight: ${font.weight.regular};
  }

  &:focus {
    outline: none;
    border-bottom-color: ${({ invalid }) => (invalid ? color.danger : color.brand)};
  }
`;

export const Hint = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
`;

export const FieldError = styled.p`
  display: flex;
  align-items: flex-start;
  gap: ${space[1]};
  margin: 0;
  color: ${color.danger};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
`;

/** 상태 피드백이 같은 부모 안에서 교체되도록 감싼다(aria-live 안정). */
export const Feedback = styled.div`
  display: grid;
  gap: ${space[1]};
  min-height: 22px;
`;

export const SuccessText = styled.p`
  display: flex;
  align-items: center;
  gap: ${space[1]};
  margin: 0;
  color: ${color.success};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
`;

/**
 * 저장 줄. 카드 하단에 얇은 선을 긋고 그 아래에 둔다 — 폼과 확정 동작이 분리되어 보인다.
 * 좁은 폭에서는 버튼이 전폭이 된다(엄지로 누르는 자리).
 */
export const SaveRow = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-top: ${space[4]};
  border-top: 1px solid ${color.border};

  > * {
    min-width: 120px;
  }

  ${media.down('mobileWide')} {
    > * {
      flex: 1 1 auto;
    }
  }
`;

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

/* ==========================================================================
   로그인 게이트 — 반전 헤드 + 흰 바디의 한 장짜리 카드
   구 게이트는 점선 파스텔 상자 아래 버튼 셋이 떠 있는 형태라 "카드"로 읽히지 않았다.
   ========================================================================== */

export const GateWrap = styled.div`
  max-width: 460px;
  margin: clamp(${space[6]}, 6vw, ${space[12]}) auto 0;
`;

export const GateCard = styled.div`
  border-radius: ${PICK_RADIUS};
  border: 1px solid ${color.border};
  background: ${color.surface};
  box-shadow: ${elevation[2]};
  overflow: hidden;
`;

export const GateHead = styled.div`
  ${brandPanel()}
  display: grid;
  justify-items: center;
  gap: ${space[3]};
  padding: clamp(${space[6]}, 5vw, ${space[10]}) ${space[5]};
  text-align: center;
`;

export const GateGlyph = styled.span`
  display: inline-grid;
  place-items: center;
  /* 배지:마크 = 2:1 — 원장 로그인 관문(48/24)과 같은 비례라 두 관문이 한 벌로 읽힌다. */
  width: 64px;
  height: 64px;
  border-radius: ${radius.pill};
  color: ${color.onPanelGold};
  border: 1px solid color-mix(in srgb, ${color.onPanelGold} 34%, transparent);
  background: color-mix(in srgb, ${color.onPanelGold} 10%, transparent);
`;

export const GateTitle = styled.h1`
  margin: 0;
  color: ${color.onPanel};
  font-family: ${font.display};
  font-size: ${heroTitleFontSize};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

export const GateSubtitle = styled.p`
  margin: 0;
  max-width: 34ch;
  color: ${color.onPanelMuted};
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  word-break: keep-all;
`;

export const GateBody = styled.div`
  display: grid;
  gap: ${space[3]};
  padding: clamp(${space[5]}, 4vw, ${space[7]});
`;

export const GateBodyLabel = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

/** 프로바이더 버튼 세로 스택. 버튼 자체는 공용 SocialLoginButton(브랜드 규정색·로고·카피). */
export const GateButtons = styled.div`
  display: grid;
  gap: ${space[2]};
`;

export const GateFootnote = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
  word-break: keep-all;
`;

/* ==========================================================================
   로딩 — 구 화면은 점선 상자 안 글자 한 줄이었다. 이제 들어올 화면의 골격을 미리 세운다.
   ========================================================================== */

export const BootWrap = styled.div`
  max-width: 1040px;
  margin: 0 auto;
  display: grid;
  gap: clamp(${space[5]}, 3vw, ${space[8]});
  align-items: start;

  ${media.up('layout')} {
    grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
  }
`;

export const BootRail = styled.div`
  ${brandPanel()}
  border-radius: ${PICK_RADIUS};
  padding: clamp(${space[5]}, 2.4vw, ${space[7]});
  display: grid;
  gap: ${space[4]};
  justify-items: start;
`;

export const BootRailBar = styled.span<{ w: string; h: string }>`
  display: block;
  width: ${({ w }) => w};
  height: ${({ h }) => h};
  border-radius: ${radius.sm};
  background: color-mix(in srgb, ${color.onPanel} 18%, transparent);
`;

export const BootBody = styled.div`
  display: grid;
  gap: ${space[4]};
  padding: clamp(${space[5]}, 2.2vw, ${space[7]});
  border-radius: ${DATA_RADIUS};
  border: 1px solid ${color.border};
  background: ${color.surface};
`;

export const BootBar = styled.span<{ w: string; h: string }>`
  display: block;
  width: ${({ w }) => w};
  height: ${({ h }) => h};
  border-radius: ${radius.sm};
  background: ${color.surfaceSunken};
`;

export const BootStatus = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
`;
