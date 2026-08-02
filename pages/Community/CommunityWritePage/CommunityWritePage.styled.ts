import styled from '@emotion/styled';
import { color, font, radius, shadow, space } from '@/shared/styles';

/**
 * 페이지 셸 + **여러 섹션이 공유하는** 폼 조각만 남긴다.
 * 섹션 전용 스타일은 각 하위 컴포넌트의 `*.styled.ts`로 옮겼다(`components/` 하위).
 * 공유 조각(FieldBlock·FieldError·EditorHint)은 하위 컴포넌트가 이 파일을 **상대 경로로** 직접 import한다
 * (페이지 배럴 경유 시 페이지→컴포넌트→페이지 순환).
 */

/**
 * 상단 바(← 목록)·제목·폼이 **같은 좌우 경계**를 갖게 하는 폭 컨테이너.
 *
 * 🔴 그전에는 제목과 폼만 760px 중앙 칼럼이었고 `CommunityTopBar` 는 전폭이라,
 * "← 목록" 버튼이 화면 왼쪽 끝에 혼자 붙어 제목 줄과 어긋나 보였다(2026-08-02 사용자 지적).
 * 상세 페이지는 같은 문제를 2026-07-28 에 `DetailShell` 로 이미 해결했다 — **같은 처방**이다.
 *
 * ⚠ 폭 제한은 여기 하나로 모은다. 자식이 자기 max-width 를 또 가지면 둘이 갈라진다.
 */
export const WriteShell = styled.div`
  /*
   * 🔴 폭 제한을 두지 않는다 — 셸('ShellMain'/'CommunityMain')이 이미 앱 공통 1160px 로 잡는다
   * (2026-08-02 사용자 결정: "다른 페이지와 동일하게"). 구 760px 은 읽기 칼럼 기준이었는데
   * 글쓰기는 **폼 컨트롤**이라 그 제약을 받을 이유가 없다(긴 문장이 한 줄로 흐르는 지면이 아니다).
   * 상단 바·제목·폼이 같은 좌우 경계를 갖는다는 원래 목적은 이 껍데기가 그대로 유지한다.
   */
  width: 100%;
  min-width: 0;
`;

/** 접근성 h1 — 시각적으로는 조용하게(xl/bold), 문서 구조상 페이지 제목. */
export const PageTitle = styled.h1`
  margin: 0 0 ${space[2]};
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

export const FieldError = styled.p`
  margin: 0;
  color: ${color.danger};
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
