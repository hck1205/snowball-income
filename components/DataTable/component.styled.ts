import styled from '@emotion/styled';

export const TableWrap = styled.div`
  overflow-x: auto;
  container-type: inline-size;
  min-width: 0;
  width: 100%;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 720px;

  @container (max-width: 820px) {
    display: block;
    min-width: 0;

    tbody {
      display: grid;
      gap: 8px;
    }

    tr {
      display: block;
      border: 1px solid #e4edf4;
      border-radius: 8px;
      padding: 4px 8px;
      background: #fbfdff;
    }
  }

  @media (max-width: 820px) {
    display: block;
    min-width: 0;

    tbody {
      display: grid;
      gap: 8px;
    }

    tr {
      display: block;
      border: 1px solid #e4edf4;
      border-radius: 8px;
      padding: 4px 8px;
      background: #fbfdff;
    }
  }
`;

export const TH = styled.th`
  text-align: right;
  border-bottom: 1px solid #dfe9f1;
  padding: 8px;

  @container (max-width: 820px) {
    display: none;
  }

  @media (max-width: 820px) {
    display: none;
  }
`;

export const TD = styled.td`
  text-align: right;
  border-bottom: 1px solid #edf3f8;
  padding: 8px;

  @container (max-width: 820px) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    text-align: right;
    padding: 8px 4px;
  }

  @container (max-width: 820px) {
    &::before {
      content: attr(data-label);
      text-align: left;
      color: #486073;
      font-size: 12px;
    }
  }

  @media (max-width: 820px) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    text-align: right;
    padding: 8px 4px;
  }

  @media (max-width: 820px) {
    &::before {
      content: attr(data-label);
      text-align: left;
      color: #486073;
      font-size: 12px;
    }
  }
`;
