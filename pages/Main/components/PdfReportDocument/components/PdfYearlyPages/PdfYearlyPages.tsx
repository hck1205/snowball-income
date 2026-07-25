import { formatKRW } from '@/shared/utils';
// 부모 배럴(../../index.ts)을 경유하면 PdfReportDocument ↔ 하위 컴포넌트 순환이 된다 — 상대 경로로 직접 가져온다.
import { Page, SectionTitle, Table, TargetCellLabel } from '../../PdfReportDocument.styled';
import { PdfPageFooter } from '../PdfPageFooter';
import type { PdfYearlyPagesProps } from './PdfYearlyPages.types';

/** ── 4. 연도별 상세 (행이 많으면 페이지가 늘어난다) ────────────────── */
function PdfYearlyPages({ yearlyPages, reachedYearLabel, title, themeVars }: PdfYearlyPagesProps) {
  /**
   * 각 페이지의 첫 행이 전체에서 몇 번째인가. `chunkYearlyRows`는 순서를 보존하므로 연차는
   * `offset + rowIndex + 1`로 그냥 센다(연도로 역검색하면 O(n²)인데다 같은 연도가 두 번 나오면 틀린다).
   * 페이지 크기 상수를 여기서 다시 쓰지 않도록 **실제 청크 길이**로 누적한다.
   */
  const yearlyPageOffsets = yearlyPages.reduce<number[]>((offsets, _rows, index) => {
    offsets.push(index === 0 ? 0 : offsets[index - 1] + yearlyPages[index - 1].length);
    return offsets;
  }, []);

  return (
    <>
      {yearlyPages.map((rows, pageIndex) => (
        <Page data-pdf-page={`yearly-${pageIndex}`} style={themeVars} key={`yearly-${rows[0]?.year ?? pageIndex}`}>
          {pageIndex === 0 ? <SectionTitle>연도별 상세</SectionTitle> : null}
          <Table>
            <thead>
              <tr>
                <th scope="col">연차</th>
                <th scope="col">연도</th>
                <th scope="col" data-numeric="true">
                  투입 원금
                </th>
                <th scope="col" data-numeric="true">
                  자산 가치
                </th>
                <th scope="col" data-numeric="true">
                  연 배당(세후)
                </th>
                <th scope="col" data-numeric="true">
                  월평균 배당
                </th>
                <th scope="col" data-numeric="true">
                  누적 배당
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => {
                const isTargetRow = reachedYearLabel !== null && row.year === reachedYearLabel;
                const yearIndex = yearlyPageOffsets[pageIndex] + rowIndex + 1;

                return (
                  <tr key={row.year} data-target-reached={isTargetRow ? 'true' : undefined}>
                    <td>{yearIndex}년차</td>
                    <td>
                      {row.year}
                      {isTargetRow ? <> <TargetCellLabel>목표 달성</TargetCellLabel></> : null}
                    </td>
                    <td data-numeric="true">{formatKRW(row.totalContribution)}</td>
                    <td data-numeric="true">{formatKRW(row.assetValue)}</td>
                    <td data-numeric="true">{formatKRW(row.annualDividend)}</td>
                    <td data-numeric="true">{formatKRW(row.monthlyDividend)}</td>
                    <td data-numeric="true">{formatKRW(row.cumulativeDividend)}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <PdfPageFooter title={title} label={`${4 + pageIndex}`} />
        </Page>
      ))}
    </>
  );
}

export default PdfYearlyPages;
