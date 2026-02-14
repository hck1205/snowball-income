import styled from '@emotion/styled';

export const FeatureLayout = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px 40px;
  display: grid;
  gap: 16px;
  color: #1f3341;
`;

export const Header = styled.header`
  display: grid;
  gap: 8px;
`;

export const HeaderTitle = styled.h1`
  margin: 0;
`;

export const HeaderDescription = styled.p`
  margin: 0;
  color: #486073;
`;

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
`;

export const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
`;

export const SummaryValue = styled.p`
  margin: 8px 0 0;
  font-size: 18px;
  font-weight: 700;
`;

export const ErrorBox = styled.div`
  border: 1px solid #f0bcbc;
  border-radius: 8px;
  padding: 10px;
  background: #fff2f2;
  color: #8d2323;
`;

export const ChartWrap = styled.div`
  width: 100%;
  height: 260px;
`;
