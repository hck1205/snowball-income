import styled from '@emotion/styled';
import { DATA_RADIUS, cardElevation, color, font, media, radius, space } from '@/shared/styles';

/* --------------------------------------------------------------------------
 * 링크 공유 화면 — **주소 한 칸에서 시작한다.**
 *
 * 🔴 제목 칸을 먼저 두지 않는다. 첫 칸이 제목이면 이 화면은 "글쓰기"가 되고, 사람들은 원문을
 * 옮겨 적기 시작한다. 첫 칸이 주소면 하는 일이 "가져오기"가 된다 — 같은 폼이 낱말 순서 하나로
 * 다른 행동을 부른다.
 * -------------------------------------------------------------------------- */

export const Form = styled.form`
  display: grid;
  gap: ${space[5]};
  max-width: 720px;
  margin-top: ${space[5]};
`;

export const Field = styled.label`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

export const FieldLabel = styled.span`
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
`;

export const UrlRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: ${space[2]};

  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const inputSurface = `
  width: 100%;
  padding: ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  color: ${color.text};
  font-family: inherit;
  font-size: ${font.size.sm};

  &::placeholder {
    color: ${color.textMuted};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 1px;
    border-color: ${color.brandBorder};
  }
`;

export const TextInput = styled.input`
  ${inputSurface}
`;

export const TextArea = styled.textarea`
  ${inputSurface}
  min-height: 96px;
  line-height: ${font.leading.relaxed};
  resize: vertical;
`;

/** 실패·안내 한 줄. 🔴 경고색을 쓰되 **다음에 할 일**까지 문장이 말한다(카피가 소유). */
export const Notice = styled.p`
  margin: 0;
  color: ${color.warning};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  word-break: keep-all;
`;

/** 저작권 고지 — 조용하지만 상시 보인다. 이 화면이 원문을 복제하는 곳이 아니라는 약속이다. */
export const CopyrightNote = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
  word-break: keep-all;
`;

/* ── 미리 보기 ──────────────────────────────────────────────────────────── */

/**
 * 가져온 결과를 **올라갈 모습 그대로** 보여 준다 — 목록 카드와 같은 재료(썸네일·출처·제목·요약).
 * 미리 보기가 실제와 다르면 그건 미리 보기가 아니다.
 */
export const Preview = styled.div`
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  gap: ${space[4]};
  padding: ${space[4]};
  border-radius: ${DATA_RADIUS};
  overflow: hidden;
  ${cardElevation('base')}

  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const PreviewThumb = styled.img`
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: ${radius.sm};
  background: ${color.surfaceMuted};
`;

export const PreviewBody = styled.div`
  display: grid;
  gap: ${space[1]};
  align-content: start;
  min-width: 0;
`;

export const PreviewSource = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
`;

export const PreviewTitle = styled.strong`
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.snug};
  word-break: keep-all;
`;

export const PreviewSummary = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  word-break: keep-all;
`;

export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
`;
