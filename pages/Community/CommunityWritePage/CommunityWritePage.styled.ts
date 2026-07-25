import styled from '@emotion/styled';
import { color, font, radius, shadow, space } from '@/shared/styles';

/**
 * 페이지 셸 + **여러 섹션이 공유하는** 폼 조각만 남긴다.
 * 섹션 전용 스타일은 각 하위 컴포넌트의 `*.styled.ts`로 옮겼다(`components/` 하위).
 * 공유 조각(FieldBlock·FieldError·EditorHint)은 하위 컴포넌트가 이 파일을 **상대 경로로** 직접 import한다
 * (페이지 배럴 경유 시 페이지→컴포넌트→페이지 순환).
 */

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
