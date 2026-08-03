import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, motion, radius, space } from '@/shared/styles';

/**
 * 첨부 섹션 — 리워크에서 **인스펙터 타일**이 됐다(가라앉은 면 위, 폭 340px).
 * 그전에는 폼 본문 흐름 안의 전폭 섹션이라 제목(lg/bold)이 본문 필드 라벨과 무게를 다퉜다.
 * 지금은 타일 머리(작은 대문자급 라벨)와 토글이 한 줄을 나눠 쓴다.
 */

/** 타일 머리 — 제목 + "첨부" 토글. FormSection 은 우측 슬롯이 없어 여기서 로컬로 조립한다. */
export const AttachSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  flex-wrap: wrap;
`;

export const AttachSectionTitle = styled.h2`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.06em;
`;

/* 첨부 상태 — 프리뷰(ready/empty)와 첨부 카드가 이 컨테이너 안에서 교체된다.
 * aria-live 가 동작하려면 상태가 **같은 부모** 안에서 갈려야 한다(부모째 갈아끼우지 말 것). */
export const AttachStates = styled.div`
  display: grid;
  gap: ${space[3]};
  min-width: 0;
`;

/**
 * 첨부할 시나리오가 없을 때. 점선 상자 + 안내 + 길(시뮬레이터로).
 * 🔴 빈 상태가 초라하면 앱이 초라해 보인다 — 세로로 세우고 여백을 줘서 "잠시 비었다"가 아니라
 * "여기서 다음에 할 일"로 읽히게 했다.
 */
export const AttachEmpty = styled.div`
  display: grid;
  justify-items: center;
  gap: ${space[3]};
  padding: ${space[6]} ${space[4]};
  border-radius: ${radius.lg};
  border: 1px dashed ${color.borderStrong};
  background: ${color.surface};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  text-align: center;
`;

/**
 * 첨부됨(수정 모드의 외부 payload) 카드.
 * 🔴 면색(brandSubtle)을 뺐다 — 이 화면의 틴트 면 예산은 없는 것이나 마찬가지고(글쓰기는 data 면),
 * "붙어 있음"은 **테두리 2px + 상단 라벨**이라는 형태 채널이 이미 말한다.
 */
export const AttachCard = styled.div`
  display: grid;
  gap: ${space[2]};
  padding: ${space[4]};
  border-radius: ${radius.lg};
  border: 2px solid ${color.brandBorder};
  background: ${color.surface};
`;

export const AttachInfo = styled.div`
  display: grid;
  gap: ${space[1]};
  min-width: 0;

  strong {
    color: ${color.text};
    font-size: ${font.size.base};
    font-weight: ${font.weight.bold};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: ${color.textSecondary};
    font-size: ${font.size.sm};
    ${font.numeric}
  }
`;

/** 빈 상태의 안내 블록 — 제목 한 줄 + 설명 한 줄. */
export const AttachPreviewInfo = styled.div`
  display: grid;
  gap: ${space[1]};
  min-width: 0;

  strong {
    color: ${color.text};
    font-size: ${font.size.md};
    font-weight: ${font.weight.bold};
  }

  span {
    color: ${color.textSecondary};
    font-size: ${font.size.sm};
    ${font.numeric}
  }
`;

export const AttachedHint = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
  white-space: normal;
`;

/**
 * 빈 상태의 "시뮬레이터로 가기" — 시맨틱 내비게이션이라 버튼이 아닌 Link.
 * 시각은 공용 Button secondary sm과 동일 토큰(borderStrong/surface/text, 32px, radius.sm).
 */
export const AttachEmptyCtaLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  padding: 0 ${space[4]};
  border-radius: ${radius.pill};
  border: 1px solid ${color.borderStrong};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  text-decoration: none;
  white-space: nowrap;
  transition: background ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
    border-color: ${color.brand};
    color: ${color.brand};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;
