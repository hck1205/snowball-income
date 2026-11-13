import styled from '@emotion/styled';
import { space } from '@/shared/styles';

/**
 * 미국 증시 안내 지면의 바깥 틀 — 읽는 폭 상한 880px, 가운데(2026-11-12).
 * 목록 부품은 `../components/GuideList`, 지면별 화면은 각 섹션 폴더에 있다(2026-11-13 분리).
 */
export const GuideStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[5]};
  width: 100%;
  max-width: 880px;
  margin: 0 auto;
  padding-bottom: ${space[7]};
  /* 한글은 단어 단위로 꺾는다("연금소/득세" 방지), 띄어쓰기 없는 긴 글은 그래도 넘치지 않게. */
  word-break: keep-all;
  overflow-wrap: anywhere;
`;
