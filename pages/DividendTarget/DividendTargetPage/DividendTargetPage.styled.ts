import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/* --------------------------------------------------------------------------
 * /dividend/how-much 의 세로 흐름:
 *
 *   질문(금액) → 답(고른 종목 자세히 + 물가) → 알아 두세요 → 다른 종목이라면(12 종) → 계산기로
 *
 * 답이 비교보다 **위**인 이유: 이 화면에 오는 사람의 질문은 "SCHD 로 월 250 이면 얼마?" 하나다.
 * 그 답을 열두 장 카드 아래에 두면 질문에 바로 답하지 않는 화면이 된다. 비교는 답을 본 다음의 호기심이다.
 *
 * 정보 줄(전제·면책)은 라벨 + 칩으로 끊는다 — 한 문장으로 흘리면 안 읽힌다(사용자 피드백 2026-08-27).
 * -------------------------------------------------------------------------- */

export const PageStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: clamp(24px, 4vw, 40px);
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding-bottom: ${space[12]};
`;

export const NotesCard = styled.section`
  display: grid;
  gap: ${space[4]};
  padding: clamp(18px, 2.4vw, 28px);
  border: 1px solid ${color.border};
  border-radius: ${radius.xl};
  background: ${color.surface};

  ${media.up('tablet')} {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: ${space[6]};
  }
`;

export const NotesTitle = styled.h2`
  grid-column: 1 / -1;
  margin: 0;
  font-size: ${font.size.lg};
  font-weight: ${font.weight.extrabold};
  color: ${color.text};
`;

export const TaxNotice = styled.div<{ $warn: boolean }>`
  display: flex;
  gap: ${space[3]};
  padding: ${space[4]};
  border: 1px solid ${({ $warn }) => ($warn ? color.warning : color.border)};
  border-radius: ${radius.lg};
  background: ${({ $warn }) => ($warn ? color.warningSurface : color.surfaceMuted)};

  > svg {
    flex: none;
    margin-top: 2px;
    color: ${({ $warn }) => ($warn ? color.warning : color.textMuted)};
  }
`;

export const TaxNoticeBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[1]};
`;

export const TaxNoticeTitle = styled.h3`
  margin: 0;
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const TaxNoticeText = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
  word-break: keep-all;
`;

export const AssumptionBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
`;

export const AssumptionTitle = styled.h3`
  margin: 0;
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const AssumptionList = styled.dl`
  display: grid;
  gap: ${space[2]};
  margin: 0;
`;

export const AssumptionItem = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[2]};

  dt {
    min-width: 4.5em;
    padding: 2px ${space[2]};
    border-radius: ${radius.sm};
    background: ${color.surfaceMuted};
    color: ${color.textSecondary};
    font-size: ${font.size.xs};
    font-weight: ${font.weight.bold};
    text-align: center;
  }

  dd {
    margin: 0;
    font-size: ${font.size.sm};
    color: ${color.text};
  }
`;

export const FinalCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
  padding: clamp(20px, 3vw, 36px);
  border: 1px solid ${color.accentAltBorder};
  border-radius: ${radius.xl};
  background: ${color.accentAltSubtle};

  ${media.up('tablet')} {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: ${space[8]};
  }
`;

export const FinalText = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[2]};
`;

export const FinalTitle = styled.h2`
  margin: 0;
  font-family: ${font.display};
  font-size: clamp(20px, 2.6vw, 26px);
  color: ${color.text};
  word-break: keep-all;
`;

export const FinalBody = styled.p`
  margin: 0;
  font-size: ${font.size.md};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
  word-break: keep-all;
`;

export const FinalButton = styled.button`
  flex: none;
  min-height: 48px;
  padding: 0 ${space[6]};
  border: 0;
  border-radius: ${radius.pill};
  background: ${color.brand};
  color: ${color.onBrand};
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
  cursor: pointer;

  &:hover {
    background: ${color.brandHover};
  }
`;

export const NotAdvice = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
  color: ${color.textMuted};
  text-align: center;
  word-break: keep-all;
`;
