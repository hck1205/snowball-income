import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, media, radius, space } from '@/shared/styles';

/*
 * "N 원을 넣으면 매달 얼마?" 답 상자 — **data 면(읽는 면)** 이다(styled/index.ts 의 면 설계).
 * 채도 면을 깔지 않는다: 이 화면의 틴트 예산(2면)은 이미 찼다. 위계는 크기와 굵기, 헤어라인이 만든다.
 */

export const AnswerSection = styled.section`
  display: grid;
  gap: ${space[4]};
  padding: clamp(${space[4]}, 3vw, ${space[6]});
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surface};
  min-width: 0;
`;

export const AnswerHeading = styled.h2`
  margin: 0;
  font-size: clamp(${font.size.lg}, 2.2vw, ${font.size['2xl']});
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
  line-height: 1.3;
  color: ${color.text};
`;

/** 주인공 숫자 둘(지금 / 재투자 후). 모바일에서는 위아래로 쌓는다. */
export const AnswerLead = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${space[4]};

  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr);
    gap: ${space[3]};
  }
`;

export const AnswerLeadItem = styled.div`
  display: grid;
  gap: ${space[1]};
  min-width: 0;
`;

export const AnswerLeadLabel = styled.dt`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${color.textMuted};
`;

export const AnswerLeadValue = styled.dd`
  margin: 0;
  font-size: clamp(${font.size['2xl']}, 3.4vw, ${font.size['4xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: ${color.text};
  ${font.numeric};
  overflow-wrap: anywhere;
`;

export const AnswerLeadCaption = styled.span`
  font-size: ${font.size.xs};
  color: ${color.textMuted};
`;

export const AnswerTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${font.size.sm};
  ${font.numeric};

  caption {
    text-align: left;
    padding-bottom: ${space[2]};
    font-size: ${font.size.xs};
    color: ${color.textMuted};
  }

  th,
  td {
    padding: ${space[2]} 0;
    border-bottom: 1px solid ${color.border};
    text-align: right;
  }

  /* 🔴 :first-of-type 가 아니라 :first-child — 본문 행의 첫 칸은 th(scope=row)라, first-of-type 이면
     가운데 td 가 "첫 td"로 잡혀 왼쪽 정렬된다(2026-11-09 스크린샷으로 발견). */
  th:first-child,
  td:first-child {
    text-align: left;
  }

  thead th {
    font-weight: ${font.weight.medium};
    color: ${color.textMuted};
  }

  tbody th {
    font-weight: ${font.weight.semibold};
    color: ${color.text};
  }
`;

export const AnswerNote = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  line-height: 1.6;
  color: ${color.textMuted};
`;

export const AnswerLink = styled(Link)`
  justify-self: start;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.brandText};
  text-decoration: underline;
  text-underline-offset: 3px;
`;
