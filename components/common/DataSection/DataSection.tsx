import {
  NoteItem,
  NoteList as NoteListRoot,
  NotePanel,
  SectionHead,
  SectionMeta,
  SectionRoot,
  SectionSubtitle,
  SectionTitle
} from './DataSection.styled';
import type { DataSectionProps, NoteListProps } from './DataSection.types';
import { splitEmphasis } from './DataSection.utils';

/**
 * 자료형 화면의 섹션 한 단락 — **제목 / 부제 / 전제 한 줄 / 본문**.
 *
 * 국회의원 거래 · 국민연금 · 증시 캘린더 세 화면이 같은 조판을 쓴다. 제목이 카드가 아니라
 * 밑줄 한 선 위에 서는 이유는 `DataSection.styled.ts` 머리말에 있다.
 *
 * ⚠ 제목은 언제나 `<h2>` 다. 이 부품을 쓰는 화면은 `PageHero` 가 `<h1>` 을 갖는다는 전제 위에 선다 —
 *   `h1` 이 없는 화면에 이걸 쓰면 문서 개요가 h2 부터 시작한다.
 */
export default function DataSection({ title, subtitle, meta, children }: DataSectionProps) {
  return (
    <SectionRoot>
      <SectionHead>
        <SectionTitle>{title}</SectionTitle>
        {subtitle ? <SectionSubtitle>{subtitle}</SectionSubtitle> : null}
      </SectionHead>
      {meta ? <SectionMeta>{meta}</SectionMeta> : null}
      {children}
    </SectionRoot>
  );
}

/**
 * "이 자료로 무엇을 말할 수 없는가"를 적는 판.
 *
 * 🔴 이 부품이 따로 있는 이유는 **자리를 못 박기 위해서**다. 자료의 한계는 표 뒤로 밀리면
 * 아무도 안 읽는다 — 쓰는 쪽이 표보다 **먼저** 놓도록 이름부터 그렇게 지었다.
 * 색은 경고색이 아니다(같은 파일 머리말 참고).
 */
export function NoteList({ items, tone = 'neutral', title, lead, footer }: NoteListProps) {
  return (
    <NotePanel $tone={tone}>
      {title ? <SectionTitle as="h2">{title}</SectionTitle> : null}
      {lead}
      {/* ⚠ 항목이 없으면 목록을 아예 그리지 않는다 — 빈 `<ul>` 은 보조기술이 "목록, 항목 0개"라고
          읽어 주는 소음이다. 머리말과 꼬리만으로 쓰는 안내 판(한국 국회 안내)이 그 경우다. */}
      {items.length > 0 ? (
        <NoteListRoot>
          {items.map((item) => (
            <NoteItem key={item}>
              <span>
                {splitEmphasis(item).map((chunk) =>
                  chunk.strong ? (
                    <strong key={chunk.text}>{chunk.text}</strong>
                  ) : (
                    <span key={chunk.text}>{chunk.text}</span>
                  )
                )}
              </span>
            </NoteItem>
          ))}
        </NoteListRoot>
      ) : null}
      {footer}
    </NotePanel>
  );
}
