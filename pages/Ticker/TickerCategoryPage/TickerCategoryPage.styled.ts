import styled from '@emotion/styled';
import { Link } from 'react-router-dom';

/**
 * `/ticker/category/:id` 의 지면.
 *
 * 이 화면의 일은 하나다 — **묶음 안에서 종목 하나를 고르게 하는 것**. 허브(`/ticker/all`)처럼 필터·정렬을
 * 두지 않는다: 한 묶음은 길어야 수십 종이라 훑어보는 편이 빠르고, 조작면이 늘면 "여기가 허브인가
 * 목록인가"가 흐려진다.
 *
 * 틴트 면은 **0개**다(허브와 같은 예산 규칙 — 공용 `PageFooter` 하나만 딸려온다).
 * 주의 문장만 왼쪽 경계선으로 강조하는데, 채도 면이 아니라 **선**이라 예산에 들어가지 않는다.
 */
export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: clamp(28px, 5vw, 44px);
  padding-bottom: 32px;
`;

export const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const Title = styled.h1`
  margin: 0;
  font-size: clamp(24px, 4.2vw, 34px);
  font-weight: 700;
  line-height: 1.32;
  color: var(--sb-text-strong);
  word-break: keep-all;
`;

export const Lede = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.7;
  color: var(--sb-text-muted);
  word-break: keep-all;
`;

/** 🔴 장점보다 먼저 오는 자리. 선 하나로 무게를 주되 채도 면을 만들지 않는다. */
export const Caution = styled.p`
  margin: 0;
  padding: 10px 0 10px 14px;
  border-left: 3px solid var(--sb-border-strong);
  font-size: 14px;
  line-height: 1.7;
  color: var(--sb-text);
  word-break: keep-all;
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--sb-text-strong);
`;

export const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
`;

export const Item = styled.li`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 0;

  & + & {
    border-top: 1px solid var(--sb-border);
  }
`;

export const ItemLink = styled(Link)`
  display: flex;
  align-items: baseline;
  gap: 10px;
  text-decoration: none;
  color: inherit;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
`;

/** 티커 심볼은 숫자·영문이라 자간을 조금 벌려 라틴 문자로 읽히게 둔다. */
export const Ticker = styled.span`
  flex: none;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--sb-identity, var(--sb-text-strong));
`;

export const ItemTitle = styled.span`
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--sb-text-strong);
  word-break: keep-all;
`;

export const Tagline = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.65;
  color: var(--sb-text-muted);
  word-break: keep-all;
`;

export const Cta = styled.p`
  margin: 0;

  a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 18px;
    border: 1px solid var(--sb-border-strong);
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    color: var(--sb-text-strong);

    &:hover,
    &:focus-visible {
      border-color: var(--sb-identity, var(--sb-text-strong));
    }
  }
`;

export const SiblingList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;

  a {
    font-size: 14px;
    color: var(--sb-text-muted);
    text-decoration: none;

    &:hover,
    &:focus-visible {
      color: var(--sb-text-strong);
      text-decoration: underline;
    }
  }
`;
