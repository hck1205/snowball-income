import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/**
 * 목표 미설정일 때 **미터 자리**를 차지하는 안내 패널.
 *
 * ## 2026-08-03 — 틴트 면을 레일로 내렸다 (예산 거래다, 취향이 아니다)
 * 종전에는 `accentSubtle` 로 **전면을 채우고** 있었다. 1280px 에서 폭 1,100px 대 · 높이 200px 대라
 * `tintscan` 의 면 판정(폭 ≥180 **그리고** 높이 ≥8 + 비중립 배경)을 여유 있게 넘겼고, 목표 미설정
 * 상태의 `/dividend/portfolio` 는 ①히어로 그라디언트 ②이 패널 ③브랜드 패널 푸터 = **3/2 로 초과**였다.
 * 그 상태를 아무도 못 본 이유는 tintscan 이 기본으로 **빈 상태**(패널이 없는 화면)만 쟀기 때문이다.
 *
 * 지금은 **중립 침강 면 한 겹**이다. "여기가 주인공 자리"라는 신호는 색면이 아니라
 * **카드 안에서 이 블록만 갖는 침강 면 + 제목 크기(h3)**가 만든다.
 *
 * 🔴 **왼쪽 색 레일을 여기 달지 마라(2026-08-03 검증에서 되돌린 자리).** 부모인 `GoalCard.CardRoot`
 * 가 이미 왼쪽 6px `accentAlt` 레일을 갖는다 — 여기에 4px `accent` 레일을 더하면 카드 왼쪽에
 * **31px 간격으로 색이 다른 세로 줄 두 개**가 서고(실측: x=53 초록 6px / x=84 파랑 4px),
 * 같은 신호를 두 번 하면서 색끼리 부딪힌다. 목표 축의 색은 카드 레일 하나가 대표한다.
 * 🔴 배경도 다시 채우지 마라 — `tools/dev/tintscan.mjs` 가 exit 1 이다.
 */
export const SetupRoot = styled.div`
  min-width: 0;
  display: grid;
  gap: ${space[3]};
  align-content: start;
  justify-items: start;
  padding: clamp(16px, 2.4vw, ${space[6]});
  border-radius: ${radius.lg};
  background: ${color.surfaceSunken};
`;

/**
 * 카드 제목(`h2`) 아래 위계 → `h3`.
 * 문단(`p`)으로 두면 스크린리더의 제목 목록에서 이 블록이 통째로 사라진다(목표 미설정 상태의
 * 주인공 자리인데도) — 시각 크기는 그대로 두고 시맨틱만 올린다.
 */
export const SetupTitle = styled.h3`
  margin: 0;
  font-size: ${font.size.lg};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.01em;
  color: ${color.text};
`;

export const SetupBody = styled.p`
  margin: 0;
  max-width: 52ch;
  font-size: ${font.size.sm};
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
`;

/** 칩 줄 바로 위 안내 — "고르면 무슨 일이 일어나는가"를 먼저 말한다. */
export const SetupLead = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
`;

/**
 * 칩 묶음. `ul`이 아니라 `div role="group"`인 이유: 이 줄의 의미는 "목록"이 아니라 **하나의 조작 묶음**이고
 * (결과 카드의 빠른 설정 행과 같은 어법), 접근명을 그룹 라벨로 붙여 "무엇의 선택지인지"를 먼저 읽힌다.
 */
export const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
`;

/** 입력 + [설정]. 좁은 폭에서는 버튼이 아래로 내려가 입력이 전 폭을 쓴다. */
export const InputRow = styled.form`
  display: flex;
  align-items: flex-end;
  gap: ${space[2]};
  width: 100%;
  max-width: 360px;

  ${media.down('mobile')} {
    flex-wrap: wrap;
    align-items: stretch;
    max-width: none;
  }
`;

export const InputSlot = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`;

/** 입력이 거절된 이유. 색만으로 말하지 않도록 문장을 그대로 띄운다. */
export const InvalidNote = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  color: ${color.danger};
  line-height: ${font.leading.snug};
`;
