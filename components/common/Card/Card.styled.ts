import styled from '@emotion/styled';

export const CardContainer = styled.section`
  background: #ffffff;
  border: 1px solid #d7e2eb;
  border-radius: 12px;
  padding: clamp(12px, 1.8vw, 16px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  min-width: 0;
  width: 100%;
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 0 0 clamp(8px, 1.6vw, 12px);
`;

export const CardTitle = styled.h2`
  margin: 0;
  color: #1f3341;
  font-size: clamp(16px, 1.8vw, 18px);
`;
