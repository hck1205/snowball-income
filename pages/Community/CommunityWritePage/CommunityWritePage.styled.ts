import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, media, motion, radius, shadow, space } from '@/shared/styles';

/** 접근성 h1 — 시각적으로는 조용하게(xl/bold), 문서 구조상 페이지 제목. */
export const PageTitle = styled.h1`
  max-width: 760px;
  margin: 0 auto ${space[2]};
  color: ${color.text};
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
`;

/**
 * 글쓰기 폼 = surface 면색 패널(갤러리 velog 카드와 같은 디자인 언어) — bg 위에서 뜨게.
 * 토큰만 사용(surface/border/shadow.e1/radius/space)해 8프리셋·라이트/다크에서 bg≠surface 유지.
 * radius.lg = 도구 카드(폼) 계열(콘텐츠 카드 radius.xs와 의도적 구분).
 */
export const WriteForm = styled.form`
  max-width: 760px;
  margin: 0 auto;
  display: grid;
  gap: ${space[6]};
  padding: clamp(${space[4]}, 4vw, ${space[8]});
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surface};
  box-shadow: ${shadow.e1};
`;

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
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
`;

export const Counter = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  ${font.numeric}
`;

/**
 * velog식 언더라인 제목 입력. 컨트롤 경계 3:1 원칙의 **의도적 예외**(스펙 §A1/§D) —
 * 화면당 1개인 문서 제목 필드라 라벨·카운터·placeholder·전역 포커스 링으로 식별이 충분하다.
 * invalid 시 언더라인이 danger(검증된 대비)로 바뀌고 aria-describedby 에러가 병기된다.
 */
export const TitleInput = styled.input<{ invalid?: boolean }>`
  width: 100%;
  height: 56px;
  padding: 0 ${space[1]};
  border: none;
  border-bottom: 1px solid ${({ invalid }) => (invalid ? color.danger : color.border)};
  border-radius: 0;
  background: transparent;
  color: ${color.text};
  font-size: ${font.size['2xl']};
  font-weight: ${font.weight.bold};

  &::placeholder {
    color: ${color.textMuted};
    font-weight: ${font.weight.regular};
  }
`;

export const FieldError = styled.p`
  margin: 0;
  color: ${color.danger};
  font-size: ${font.size.sm};
`;

/* ── 첨부 섹션 헤더 (제목 + "첨부" 토글) ──────────────────────────────────────
 * FormSection은 title 우측 슬롯을 지원하지 않아, 이 섹션만 헤더를 로컬로 조립한다.
 * 제목 타이포는 common FormSection.SectionTitle과 동일(lg/bold/tight/-0.01em). */
export const AttachSection = styled.section`
  display: grid;
  gap: ${space[3]};
`;

export const AttachSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
`;

export const AttachSectionTitle = styled.h3`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.01em;
`;

/* 첨부 상태 — 프리뷰(ready/empty)와 첨부 카드가 이 컨테이너 안에서 교체된다.
 * aria-live가 동작하려면 상태가 **같은 부모** 안에서 갈려야 한다(부모째 갈아끼우지 말 것). */
export const AttachStates = styled.div`
  display: grid;
  gap: ${space[2]};
`;

/* 첨부 카드 */
export const AttachEmpty = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  flex-wrap: wrap;
  padding: ${space[4]};
  border-radius: ${radius.md};
  border: 1px dashed ${color.border};
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
`;

export const AttachCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  padding: ${space[4]};
  border-radius: ${radius.md};
  border: 1px solid ${color.brandBorder};
  background: ${color.brandSubtle};
`;

export const AttachInfo = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;

  strong {
    color: ${color.text};
    font-size: ${font.size.base};
    font-weight: ${font.weight.bold};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: ${color.textSecondary};
    font-size: ${font.size.sm};
    ${font.numeric}
  }
`;

/** 프리뷰(미첨부) 상태의 좌측 정보 블록 — 첨부 카드와 같은 요약 포맷을 쓴다. */
export const AttachPreviewInfo = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
  flex: 1 1 240px;

  strong {
    color: ${color.text};
    font-size: ${font.size.sm};
    font-weight: ${font.weight.semibold};
  }

  span {
    color: ${color.textSecondary};
    font-size: ${font.size.sm};
    ${font.numeric}
  }
`;

/** 첨부 완료 표시(✓) — 표시색만 brand, 의미는 옆의 이름 텍스트가 전달한다. */
export const AttachCheck = styled.span`
  color: ${color.brand};
  font-size: 1em;
`;

/* ── State A: 택1 카드 피커 (radiogroup) ──────────────────────────────────── */

/**
 * 라디오그룹 컨테이너. 폼 폭에 **꽉 맞게** — 내부 스크롤/scrollbar-gutter를 두지 않는다.
 * (구 버전은 scrollbar-gutter:stable 로 우측에 스크롤바 폭을 상시 예약해 다른 폼 필드와
 *  우측 정렬이 어긋났다. 사용자 피드백으로 제거.) 옵션 카드는 자연 높이로 흐른다.
 */
export const PickerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: ${space[2]};

  ${media.down('mobileWide')} {
    grid-template-columns: 1fr;
  }
`;

/**
 * 카드 = role="radio" 버튼. 선택 상태는 `aria-checked` 어트리뷰트 셀렉터로만 스타일링해
 * 시각과 접근성이 어긋날 여지를 없앤다. 선택 카드 토큰은 첨부됨 AttachCard와 동일
 * (brandBorder/brandSubtle) — "고른 카드 = 첨부될 카드" 연속성.
 */
export const ScenarioOption = styled.button`
  display: grid;
  gap: 2px;
  width: 100%;
  min-width: 0;
  padding: ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  /* surfaceSunken = 폼 surface 패널 위에서 옵션 카드가 자체 카드로 뜨게(velog PreviewBlock과 동일 관례). */
  background: ${color.surfaceSunken};
  text-align: left;
  cursor: pointer;
  transition: background ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
    border-color: ${color.brandBorder};
  }

  &[aria-checked='true'] {
    border-color: ${color.brandBorder};
    background: ${color.brandSubtle};
  }

  /* 비활성(무효 payload): 회색 + dashed 보더. 호버·선택 효과 무효. */
  &[aria-disabled='true'] {
    background: ${color.surfaceMuted};
    color: ${color.textMuted};
    border-style: dashed;
    border-color: ${color.border};
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 1px;
  }
`;

export const OptionHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[2]};
`;

export const OptionTitle = styled.strong<{ muted?: boolean }>`
  min-width: 0;
  /* 비활성 카드에선 제목도 muted(색만으로 의미 전달 아님 — dashed·텍스트 병기). */
  color: ${({ muted }) => (muted ? color.textMuted : color.text)};
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** 컨텍스트 줄 — 프리뷰/첨부 카드와 동일 토큰(textSecondary, sm, numeric). 선택 가능 카드에만 렌더된다. */
export const OptionContext = styled.span`
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  ${font.numeric}
`;

/** 비활성 사유 — issueMessage 텍스트. */
export const OptionUnavailable = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;

export const AttachedHint = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
  white-space: normal;
`;

/**
 * 빈 상태의 "시뮬레이터로 가기" — 시맨틱 내비게이션이라 버튼이 아닌 `Link`.
 * 시각은 공용 Button secondary sm과 동일 토큰(borderStrong/surface/text, 32px, radius.sm).
 */
export const AttachEmptyCtaLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 ${space[3]};
  border-radius: ${radius.sm};
  border: 1px solid ${color.borderStrong};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  text-decoration: none;
  white-space: nowrap;
  transition: background ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
    border-color: ${color.brandBorder};
  }
`;

/** 비공개 토글 + 상태 안내 문구를 **한 행에 나란히**(문구를 토글 아래가 아니라 옆에). */
export const VisibilityRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  flex-wrap: wrap;
`;

export const VisibilityText = styled.p`
  margin: 0;
  min-width: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
`;

export const ActionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${space[2]};
  border-top: 1px solid ${color.border};
  padding-top: ${space[4]};
`;

export const EditorHint = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;

/* 로그인 게이트 / 로딩 */
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
