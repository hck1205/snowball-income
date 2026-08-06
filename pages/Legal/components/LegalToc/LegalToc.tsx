import type { MouseEvent } from 'react';
import { scrollToClause } from '../../utils';
import type { LegalTocProps } from './LegalToc.types';
import {
  TocCount,
  TocItem,
  TocLabel,
  TocLink,
  TocList,
  TocOrdinal,
  TocRoot,
  TocTitle
} from './LegalToc.styled';

/**
 * 조항 목차.
 *
 * 이 화면에 없던 것이고, 없어서 가장 아쉬웠던 것이다 — 개인정보처리방침은 절이 열다섯, 이용약관은
 * 열넷이라 "제10조가 어디였더라"를 찾으려면 처음부터 굴려야 했다. 목차는 세 가지를 동시에 준다:
 * ①문서의 크기를 미리 알려 주고 ②원하는 조항으로 한 번에 데려가고 ③지금 어디쯤인지 표시한다.
 *
 * 🔴 링크의 이름은 **제목만**이다(번호 span 은 `aria-hidden`). 번호를 이름에 넣으면 스크린리더가
 *    "제십조 제십조 책임의 제한"처럼 조항 제목과 겹쳐 읽는 자리가 생긴다. 번호는 시각적 정렬용이다.
 *
 * `href` 를 그대로 두고 기본 동작만 막는 이유는 `pages/Legal/utils/scrollToClause.ts` 에 적혀 있다
 * (주소에 해시를 남기지 않는다 — 이 URL 은 구글 OAuth 심사가 여는 주소다).
 */
export default function LegalToc({ entries, activeId }: LegalTocProps) {
  const handleJump = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    // 새 탭·새 창으로 여는 조작은 가로채지 않는다.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (scrollToClause(id)) event.preventDefault();
  };

  return (
    <TocRoot aria-label="조항 목차">
      <TocTitle>
        목차
        <TocCount>{entries.length}개 항목</TocCount>
      </TocTitle>

      <TocList>
        {entries.map((entry) => {
          const isActive = entry.id === activeId;

          return (
            <TocItem key={entry.id}>
              <TocLink
                href={`#${entry.id}`}
                $active={isActive}
                aria-current={isActive ? 'true' : undefined}
                onClick={(event) => handleJump(event, entry.id)}
              >
                {/*
                 * 번호가 없는 절(개요·부칙)에도 자리는 남긴다 — 없으면 그 줄만 왼쪽으로 튄다.
                 * 자리표는 줄표가 아니라 가운뎃점이다: 개요 절의 제목이 이미 줄표를 쓴다
                 * ("이 서비스의 구조 — 먼저 알아 두실 것") — 같은 기호가 붙어 나오면 한 문장으로 읽힌다.
                 */}
                <TocOrdinal aria-hidden>{entry.ordinal ?? '·'}</TocOrdinal>
                <TocLabel>{entry.label}</TocLabel>
              </TocLink>
            </TocItem>
          );
        })}
      </TocList>
    </TocRoot>
  );
}
