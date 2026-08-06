import styled from '@emotion/styled';
import { space } from '@/shared/styles';

/*
 * 🔴 여기 있던 `BoardLegend`/`BoardLegendLabel`/`BoardLegendItem`(읽기 전용 범례)은 2026-08-04 에
 * 지웠다. 그 주석은 "필터가 아니다 — 누를 수 있어 보이는 형태를 주지 않는다"였는데, 사용자 지시로
 * 그 전제가 뒤집혔다(분류는 이제 누르는 것이고 '글 종류' 라벨 낱말은 없앤다).
 * 대체물은 `pages/Community/components/BoardCategoryFilter` 다 — 줄의 껍데기(가로 나열·줄바꿈·
 * 하단 헤어라인)까지 그 파일이 물려받았으므로 여기에 남은 것은 목록과 센티널뿐이다.
 */

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
