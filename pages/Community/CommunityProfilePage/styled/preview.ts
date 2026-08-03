import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

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
