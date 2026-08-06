import type { LegalBlock } from '../LegalDocument';
import { splitLegalHeading } from '../../utils';
import type { LegalClauseProps } from './LegalClause.types';
import {
  ClauseBody,
  ClauseHeading,
  ClauseLabel,
  ClauseOrdinal,
  ClauseRoot,
  DefinitionDescription,
  DefinitionList,
  DefinitionRow,
  DefinitionTerm,
  List,
  ListItem,
  Paragraph,
  Table,
  TableCaption,
  TableCell,
  TableHeaderCell,
  TableRow,
  TableScroller
} from './LegalClause.styled';

/**
 * 법무 문서의 **조항 한 개**. 번호 기둥 + 제목 + 본문 블록으로 이루어진다.
 *
 * 왜 컴포넌트로 떼어 냈나 — 예전에는 문서 컴포넌트 하나가 셸·히어로·절 반복·블록 렌더를 전부 갖고
 * 있어서 "조항의 모양"을 손보려면 화면 전체를 읽어야 했다. 목차·진행 표시가 붙으면서 그 파일은
 * 더 커진다. 조항은 이 문서에서 **가장 많이 반복되는 단위**(문서당 13~14개)라 여기서 가른다.
 */
function renderBlock(block: LegalBlock, key: number, sectionId: string) {
  switch (block.kind) {
    case 'paragraph':
      return <Paragraph key={key}>{block.text}</Paragraph>;

    case 'list':
      return (
        <List key={key}>
          {block.items.map((item) => (
            <ListItem key={item}>{item}</ListItem>
          ))}
        </List>
      );

    case 'definitions':
      return (
        <DefinitionList key={key}>
          {block.items.map((item) => (
            // dl 의 dt/dd 는 형제여야 하므로 줄 묶음은 div 로 감싼다(HTML 5.2 이후 허용).
            <DefinitionRow key={item.term}>
              <DefinitionTerm>{item.term}</DefinitionTerm>
              <DefinitionDescription>{item.description}</DefinitionDescription>
            </DefinitionRow>
          ))}
        </DefinitionList>
      );

    case 'table': {
      /* 절 id 는 문서 안에서 고유하고(LegalDocument.types.ts) 블록 순서는 그 절 안에서 고유하다. */
      const captionId = `${sectionId}-table-${key}`;

      return (
        /*
         * 가로 스크롤 영역은 키보드로도 움직일 수 있어야 한다(표 안에 포커스 가능한 자손이 없어
         * tabIndex 가 없으면 잘린 열에 닿을 방법이 아예 없다 — WCAG 2.1.1).
         *
         * 🔴 이름은 aria-label 이 아니라 aria-labelledby 로 caption 을 가리킨다. 같은 문자열을
         * 양쪽에 적으면 스크린리더가 영역 이름으로 한 번, 표 캡션으로 또 한 번 **같은 제목을 두 번**
         * 읽는다. 가리키면 하나의 문자열이 두 역할을 겸한다.
         *
         * 역할은 group 이 아니라 region 이다 — 이 앱의 가로 스크롤 표 처방을 하나로 통일했고
         * (형제: pages/DividendCalendar/.../ScheduleLegendTable.tsx), 고른 쪽이 region 인 이유는
         * ①group 은 랜드마크가 아니라 랜드마크 탐색(NVDA D)으로 도달할 수 없는데 이 상자는
         * "찾아가서 밀어야" 내용이 보이는 자리이고 ②이 화면은 이미 절마다 section aria-labelledby
         * = 랜드마크라, 표만 비랜드마크로 두면 같은 문서 안에서 규칙이 두 벌이 된다.
         */
        <TableScroller key={key} tabIndex={0} role="region" aria-labelledby={captionId}>
          <Table>
            <TableCaption id={captionId}>{block.caption}</TableCaption>
            <thead>
              <tr>
                {block.columns.map((column) => (
                  <TableHeaderCell key={column} scope="col">
                    {column}
                  </TableHeaderCell>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <TableRow key={row.join('|')}>
                  {row.map((cell, cellIndex) => (
                    // 같은 행 안에서 같은 문자열이 반복될 수 있어 열 위치를 키에 넣는다(열 순서는 고정이다).
                    // eslint-disable-next-line react/no-array-index-key
                    <TableCell key={cellIndex}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </tbody>
          </Table>
        </TableScroller>
      );
    }

    default:
      return null;
  }
}

export default function LegalClause({ section, index }: LegalClauseProps) {
  const { ordinal, gap, label } = splitLegalHeading(section.heading);

  return (
    <ClauseRoot aria-labelledby={section.id} $first={index === 0}>
      {/*
       * 🔴 제목의 자식 구성이 바뀌어도 **텍스트는 원문 그대로**여야 한다 — 이 문자열이 위
       * aria-labelledby 가 가리키는 절의 이름이다. 번호와 제목 사이의 `{gap}` 이 원문 공백이다.
       *
       * tabIndex={-1} 은 목차에서 넘어온 초점을 받기 위한 것이다(pages/Legal/utils/scrollToClause.ts).
       */}
      <ClauseHeading id={section.id} tabIndex={-1}>
        {ordinal === null ? (
          <ClauseLabel $inset>{label}</ClauseLabel>
        ) : (
          <>
            <ClauseOrdinal>{ordinal}</ClauseOrdinal>
            {gap}
            <ClauseLabel $inset={false}>{label}</ClauseLabel>
          </>
        )}
      </ClauseHeading>

      <ClauseBody>
        {section.blocks.map((block, blockIndex) => renderBlock(block, blockIndex, section.id))}
      </ClauseBody>
    </ClauseRoot>
  );
}
