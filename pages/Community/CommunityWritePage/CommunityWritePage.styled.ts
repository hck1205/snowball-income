import styled from '@emotion/styled';
import { appHeaderHeight, color, font, media, radius, shadow, space, zIndex } from '@/shared/styles';

/**
 * ── 글쓰기 (2026-08-03 리워크) ──────────────────────────────────────────────
 *
 * 그전에는 **하나의 흰 카드에 전부 세로로 쌓여** 있었다: 분류 → 제목 → 에디터 → 첨부 → 공개범위 →
 * [취소][등록]. 글을 쓰는 칸과 설정 칸이 같은 폭·같은 여백·같은 면색이라, 스크롤을 내리는 동안
 * 지금 무엇을 하는 중인지가 화면에서 사라졌고 [등록]은 맨 아래까지 내려가야 보였다.
 *
 * 지금은 **에디터 작업대**다.
 *
 * ```
 * ┌ 커맨드 바 (sticky) ─ 제목(h1) ···················· [취소] [등록하기] ┐
 * ├──────────────────────────────────────┬──────────────────────────────┤
 * │ SHEET (raised) — 문서                 │ INSPECTOR (sunken) — 설정     │
 * │  제목 입력                             │  글 종류                      │
 * │  본문 에디터                           │  시뮬레이션 첨부              │
 * │                                       │  게시 설정                    │
 * └──────────────────────────────────────┴──────────────────────────────┘
 * ```
 *
 * - **위계 3단이 수단으로 갈린다**: 커맨드 바 = 그림자(raised) · 시트 = 테두리(base) ·
 *   인스펙터 = 면색(sunken). `cardElevation` 이 정한 "층마다 한 가지 수단" 규칙 그대로다.
 * - 🔴 커맨드 바는 **form 안**이다 — submit 버튼이 폼 밖으로 나가면 Enter 제출·네이티브 검증이 끊긴다.
 * - ⚠ 폭 제한은 셸(CommunityMain, 1200px)이 잡는다. 여기서 max-width 를 또 두면 둘이 갈라진다.
 */

export const WriteShell = styled.div`
  width: 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[4]};
`;

/**
 * 폼 = [커맨드 바] 위, [작업 영역] 아래의 세로 스택.
 *
 * 🔴 **커맨드 바를 2열 격자의 span 자식으로 두면 sticky 가 죽는다.** 격자 아이템의 sticky
 * 컨테이닝 블록은 자기 그리드 영역이고, 커맨드 바가 차지하는 행의 높이는 딱 자기 높이라
 * 이동할 여백이 0 이다(붙어 있을 곳이 없어 그냥 흘러간다). 그래서 폼은 1열로 두고, 2열은
 * 안쪽 `WorkArea` 가 만든다 — 그러면 커맨드 바의 컨테이닝 블록이 폼 전체(긴 높이)가 된다.
 */
export const WriteForm = styled.form`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[4]};
`;

/**
 * 작업 영역 = 문서 시트 + 인스펙터의 2열.
 * 인스펙터가 아예 없으면(운영자 아닌 사용자의 게시판 글 등) 시트가 전폭을 쓴다 — 340px 짜리
 * 빈 칼럼을 남겨 두면 "뭔가 사라진 화면"으로 보인다.
 */
export const WorkArea = styled.div<{ hasSide: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: ${space[5]};

  ${media.up('layout')} {
    grid-template-columns: ${({ hasSide }) => (hasSide ? 'minmax(0, 1fr) 340px' : 'minmax(0, 1fr)')};
    gap: clamp(${space[5]}, 2.4vw, ${space[8]});
  }
`;

/**
 * 커맨드 바 — 화면에서 유일한 raised 면.
 *
 * 🔴 [등록하기]가 **항상 화면에 있다.** 그전에는 폼 맨 아래에 있어, 긴 글을 쓰는 동안 저장 버튼이
 * 스크롤 밖이었다(모바일에서는 본문 에디터 480px 아래).
 * sticky 기준선은 AppHeader 가 실측해 발행하는 변수라 헤더가 1줄/2줄로 바뀌어도 어긋나지 않는다.
 */
export const CommandBar = styled.div`
  position: sticky;
  top: calc(${appHeaderHeight} + ${space[2]});
  z-index: ${zIndex.stickyAction};

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[4]};
  flex-wrap: wrap;
  padding: ${space[3]} clamp(${space[3]}, 2vw, ${space[5]});
  border-radius: ${radius.lg};
  background: ${color.surfaceRaised};
  box-shadow: ${shadow.e2};
`;

/** 접근성 h1 — 커맨드 바의 왼쪽 라벨. 지금 무엇을 하는 중인지가 스크롤 내내 남는다. */
export const PageTitle = styled.h1`
  margin: 0;
  min-width: 0;
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.01em;
`;

export const ActionBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  margin-left: auto;
`;

/**
 * 문서 시트 — 제목과 본문만 산다. 넓은 패딩이 "여기가 지면"이라고 말한다.
 * `base` 층이라 수단은 테두리 하나뿐이다(그림자는 커맨드 바가 가져갔다).
 */
export const Sheet = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[5]};
  min-width: 0;
  padding: clamp(${space[4]}, 3vw, ${space[8]});
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surface};
`;

/**
 * 인스펙터 — 설정이 사는 좁은 칼럼. 각 섹션이 가라앉은 타일 하나다.
 * 데스크톱에서는 시트와 함께 스크롤되지만 sticky 로 붙지 않는다 — 첨부 피커가 길어지면
 * 스크롤이 갇히기 때문이다(커맨드 바만 붙는다).
 */
export const Inspector = styled.aside`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[4]};
  min-width: 0;
`;

export const InspectorSection = styled.div`
  display: grid;
  gap: ${space[3]};
  min-width: 0;
  padding: clamp(${space[4]}, 2vw, ${space[5]});
  border-radius: ${radius.lg};
  background: ${color.surfaceSunken};
`;

/** 인스펙터 타일의 머리 — 제목 한 줄. 시트 쪽 라벨보다 작고 자간이 넓다(성격이 다른 지면). */
export const InspectorTitle = styled.h2`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.06em;
`;

/** 인스펙터 타일의 머리가 **컨트롤의 라벨**을 겸할 때(글 종류). 시각은 InspectorTitle 과 같다. */
export const InspectorLabel = styled.label`
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.06em;
`;

export const FieldBlock = styled.div`
  display: grid;
  gap: ${space[2]};
`;

export const FieldError = styled.p`
  margin: 0;
  color: ${color.danger};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
`;

export const EditorHint = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
`;
