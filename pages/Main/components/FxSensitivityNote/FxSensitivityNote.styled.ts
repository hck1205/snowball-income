import styled from '@emotion/styled';

/**
 * 환율 민감도 안내의 지면.
 *
 * 🔴 **채도 면을 만들지 않는다**(틴트 예산). 경고처럼 보이면 "환율이 위험하다"는 방향성을 주는데,
 * 이 안내의 목적은 겁주기가 아니라 **결과가 그만큼 흔들린다는 사실**을 말하는 것이다.
 * 선 하나와 작은 글씨로 충분하다 — 결과를 가리지 않으면서 눈에는 들어온다.
 */
export const Wrapper = styled.aside`
  margin-top: 12px;
  padding: 10px 0 0 12px;
  border-left: 2px solid var(--sb-border);
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const Title = styled.p`
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--sb-text-strong);
  word-break: keep-all;
`;

export const Body = styled.p`
  margin: 0;
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--sb-text-muted);
  word-break: keep-all;
`;

/** 환율 실값. 숫자가 라틴 문자라 본문보다 살짝 작게 두고 자간만 벌린다. */
export const Rate = styled.p`
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.01em;
  color: var(--sb-text-muted);
`;
