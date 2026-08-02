import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/**
 * S3 "배당을 알기 전에, 세 단어" — 주식 → ETF → 배당주.
 *
 * 🔴 **한 섹션 안의 3단이다.** 섹션 셋으로 쪼개지 않는다(투어처럼 읽힌다). 하나의 section,
 * 하나의 h2, 그 안에 h3 셋이다.
 *
 * 🔴 **상자가 아니라 격자다**(2026-08-01 시각 언어 리워크). 같은 크기 카드 3장을 가로로 세우는 것은
 * 이 페이지에서 27번 반복되던 어법이었다 — 상단 1px 가로선과 열 사이 1px 세로선이 그 자리를 대신하고,
 * **격자 자체가 "셋을 비교하라"고 말한다**. 카드 사이 갭에 있던 화살표 의사요소는 갭이 사라지면서
 * 함께 폐기했다(직전 패스가 그것을 16px 로 키웠지만, 그 처방은 갭의 존재를 전제한 것이다).
 * 순서는 계속 순서 배지 숫자 1·2·3 이 말한다.
 */

export const ConceptGrid = styled.ol`
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
  min-width: 0;
  border-top: 1px solid ${color.border};

  ${media.up('tablet')} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    column-gap: 0;
  }

  ${media.down('tablet')} {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 0;
  }
`;

export const ConceptItem = styled.li`
  display: grid;
  /* 🔴 3열 비교의 전제는 "셋이 같은 자리에서 시작한다"이다. 기본값(stretch)이면 남는 높이가
     행 사이로 배분돼 h3 가 646/641/636 으로 갈렸다(2026-08-01 실측).
     바닥만 맞아 있어 캡처를 대충 보면 정상으로 읽힌다 — 좌표를 재야 보인다. */
  align-content: start;
  gap: ${space[2]};
  min-width: 0;
  padding: ${space[5]} clamp(16px, 2vw, 24px) 0;

  ${media.up('tablet')} {
    /* 열을 가르는 1px. 색이 유일한 신호가 아니다 - 같은 열 안에 순서 배지 숫자가 서 있다. */
    & + & {
      border-left: 1px solid ${color.accentBorder};
    }

    /* 🔴 가로 패딩은 **열 사이**에만 있어야 한다. 카드를 지우면서 카드의 바깥쪽 패딩을 같이 지우지
       않으면 이 섹션만 왼쪽 마진 선을 깬다 - 실측 @1280 에서 섹션 루트·S4 문단·FAQ 머리가 전부
       left 113 인데 S3 첫 열 배지만 137 이었고(패딩 24px), 마지막 열도 상단 룰보다 24px 짧게
       끝났다(2026-08-01). 격자의 바깥 가장자리는 룰의 양 끝과 맞아야 격자로 읽힌다. */
    &:first-of-type {
      padding-left: 0;
    }

    &:last-of-type {
      padding-right: 0;
    }
  }

  ${media.down('tablet')} {
    /* 1열 스택에서는 가로 패딩이 전부 마진 선을 깨는 들여쓰기일 뿐이다. 세로는 대칭이어야 한다 -
       padding-bottom 이 0 이면 구분선이 앞 문단에 붙고 다음 항목과만 떨어져 소속이 뒤바뀐다. */
    padding: ${space[4]} 0;

    &:last-of-type {
      padding-bottom: 0;
    }

    & + & {
      border-top: 1px solid ${color.border};
    }
  }
`;

export const ConceptHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
`;

/** 순서 배지 — 숫자는 데이터 서체, 면은 검증된 accent 쌍(파생 면 아님). 이 섹션의 등급은 C 라
    페이지 정체색(identity)을 쓰지 않는다 — identity 는 등급 A·B 의 면과 룰이 갖는다. */
export const ConceptOrder = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  border-radius: ${radius.sm};
  background: ${color.accentSubtle};
  color: ${color.accentText};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
`;

export const ConceptTitle = styled.h3`
  margin: 0;
  min-width: 0;
  font-family: ${font.display};
  /* 🔴 랜딩의 카드·묶음 제목은 **한 크기**다(14px). 이 한 줄이 390 에서 h2 16 / h3 16 으로
     붕괴해 있던 단차를 16 / 14 로 푼다 - GroupTitle·PresetTitle·FactorTitle·ChecklistTitle 은
     이미 같은 크기다. */
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const ConceptBody = styled.p`
  margin: 0;
  font-family: ${font.sans};
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
  word-break: keep-all;
`;
