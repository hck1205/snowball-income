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
   --------------------------------------------------------------------------
   관심사별 분할 지도 (원본 CommunityProfilePage.styled.ts 742줄을 값 변경 없이 옮긴 것):
     shell.ts        콘솔 셸 골격 + 아이덴티티 레일(반전 면)
     section.ts      작업 영역 컨테이너 + 편집 카드/섹션 머리
     preview.ts      표시 이름 미리보기
     nicknameForm.ts 닉네임 입력·글자수 계기·피드백·저장 줄
     dangerZone.ts   위험 영역(탈퇴 아코디언)
     gate.ts         로그인 게이트 카드
     boot.ts         로딩 골격
   ========================================================================== */

export {
  ConsoleRoot,
  TopBarSlot,
  IdentityRail,
  RailGlyph,
  RailEyebrow,
  RailTitle,
  RailLead,
  RailDivider,
  RailNav,
  RailNavLink
} from './shell';

export { ConsoleBody, Section, SectionHead, SectionGlyph, SectionTitle } from './section';

export { PreviewCard, PreviewGlyph, PreviewTexts, PreviewName, PreviewCaption } from './preview';

export {
  FieldBlock,
  LabelRow,
  FieldLabel,
  Counter,
  NicknameInput,
  Hint,
  FieldError,
  Feedback,
  SuccessText,
  SaveRow
} from './nicknameForm';

export {
  DangerLabelRow,
  DangerZone,
  DangerAccordion,
  DangerHeader,
  DangerGlyph,
  DangerHeaderText,
  DangerTitle,
  DangerCaption,
  Chevron,
  DangerPanel,
  DangerPanelInner,
  DangerPanelBody,
  DangerScopeCard,
  DangerScopeIntro,
  DangerScopeList,
  DangerIrreversible,
  DangerActions
} from './dangerZone';

export {
  GateWrap,
  GateCard,
  GateHead,
  GateGlyph,
  GateTitle,
  GateSubtitle,
  GateBody,
  GateBodyLabel,
  GateButtons,
  GateFootnote
} from './gate';

export { BootWrap, BootRail, BootRailBar, BootBody, BootBar, BootStatus } from './boot';
