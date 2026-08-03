import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/**
 * 분류 안내 줄 — 목록 위에 서는 **읽기 전용 범례**다.
 *
 * 게시판 글은 분류(질문&고민·인사이트·건의사항·공지)를 갖지만, 예전 목록에서 그 사실은
 * 행 안의 작은 배지로만 드러났다 — 목록을 처음 보는 사람은 "여기 무엇을 쓰는 곳인가"를
 * 알 수 없었고, 그 답이 머리 면 리드 한 문장에만 있었다. 낱말을 목록 바로 위에 세워
 * 배지가 나타났을 때 그것이 무엇인지 이미 알고 있게 한다.
 *
 * 🔴 필터가 아니다(게시판은 평면 목록·최신순 단일 축이다). 그래서 버튼이 아니라 글이고,
 *    누를 수 있어 보이는 형태를 주지 않는다.
 */
export const BoardLegend = styled.p`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[2]};
  margin: 0 0 clamp(${space[4]}, 2vw, ${space[6]});
  padding-bottom: ${space[3]};
  border-bottom: 1px solid ${color.border};
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;

export const BoardLegendLabel = styled.span`
  color: ${color.textSecondary};
  font-weight: ${font.weight.semibold};
`;

export const BoardLegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.textSecondary};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
  white-space: nowrap;
`;

/**
 * 글 목록.
 * 각 행이 자기 면·반경·부상을 가지므로 구분선 대신 세로 간격이 리듬을 만든다
 * (갤러리 "목록 보기"와 같은 관례 — 두 화면이 같은 행 부품을 쓴다).
 */
export const BoardList = styled.ul`
  list-style: none;
  margin: 0;
  padding: ${space[1]} 0 0;
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
`;

/** 무한스크롤 센티널. */
export const Sentinel = styled.div`
  min-height: 1px;
`;
