import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DataSection, { NoteList } from './DataSection';
import { splitEmphasis } from './DataSection.utils';

/**
 * 자료형 화면 셋(국회의원 거래·국민연금·증시 캘린더)이 공유하는 섹션 부품의 계약.
 *
 * 🔴 여기서 지키는 것은 **모양이 아니라 의미**다 — 제목이 진짜 헤딩으로 나가는지, 한계 문구가
 * 목록으로 읽히는지. Emotion 클래스나 색은 단정하지 않는다(이 레포 공통 규율).
 */
describe('DataSection', () => {
  it('제목을 헤딩으로 낸다 — 페이지 개요에서 섹션이 목차가 된다', () => {
    render(
      <DataSection title="가장 많이 오르내린 종목">
        <p>본문</p>
      </DataSection>
    );

    expect(screen.getByRole('heading', { name: '가장 많이 오르내린 종목' })).toBeInTheDocument();
  });

  it('부제와 전제 줄은 준 것만 그린다 — 빈 자리를 “—” 로 채우지 않는다', () => {
    const { rerender } = render(
      <DataSection title="제목" subtitle="부제입니다" meta="기준일 2026-08-04">
        <p>본문</p>
      </DataSection>
    );
    expect(screen.getByText('부제입니다')).toBeInTheDocument();
    expect(screen.getByText('기준일 2026-08-04')).toBeInTheDocument();

    rerender(
      <DataSection title="제목">
        <p>본문</p>
      </DataSection>
    );
    expect(screen.queryByText('부제입니다')).not.toBeInTheDocument();
    expect(screen.queryByText('기준일 2026-08-04')).not.toBeInTheDocument();
  });

  it('본문을 그대로 품는다', () => {
    render(
      <DataSection title="제목">
        <table>
          <caption>표</caption>
          <tbody>
            <tr>
              <td>값</td>
            </tr>
          </tbody>
        </table>
      </DataSection>
    );

    expect(screen.getByRole('table', { name: '표' })).toBeInTheDocument();
  });
});

describe('NoteList — 자료의 한계', () => {
  const ITEMS = [
    '**보유가 아니라 거래입니다.** 지금 무엇을 들고 있는지는 알 수 없습니다.',
    '**금액이 구간입니다.** 그래서 합계도 범위로만 말할 수 있습니다.'
  ];

  it('항목마다 한 줄씩 목록으로 읽힌다', () => {
    render(<NoteList items={ITEMS} title="읽기 전에" />);

    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  });

  it('앞머리 강조가 진짜 strong 으로 나간다 — 별표가 화면에 남지 않는다', () => {
    render(<NoteList items={ITEMS} />);

    expect(screen.getByText('보유가 아니라 거래입니다.').tagName).toBe('STRONG');
    // 원문 마크업(`**`)이 사용자에게 보이면 안 된다.
    expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument();
  });

  it('제목·머리말·꼬리를 준 것만 그린다', () => {
    render(<NoteList items={ITEMS} title="읽기 전에" lead={<p>머리말</p>} footer={<p>꼬리</p>} />);

    expect(screen.getByRole('heading', { name: '읽기 전에' })).toBeInTheDocument();
    expect(screen.getByText('머리말')).toBeInTheDocument();
    expect(screen.getByText('꼬리')).toBeInTheDocument();
  });

  /** 빈 `<ul>` 은 보조기술이 "목록, 항목 0개"라고 읽어 주는 소음이다 — 머리말·꼬리만 쓸 수 있어야 한다. */
  it('항목이 없으면 목록 자체를 그리지 않는다', () => {
    render(<NoteList items={[]} title="안내" lead={<p>본문만 있습니다</p>} />);

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByText('본문만 있습니다')).toBeInTheDocument();
  });
});

describe('splitEmphasis', () => {
  it('강조 조각만 strong 으로 표시한다', () => {
    expect(splitEmphasis('**앞머리** 뒤 문장')).toEqual([
      { text: '앞머리', strong: true },
      { text: ' 뒤 문장', strong: false }
    ]);
  });

  it('강조가 없으면 통째로 한 조각이다', () => {
    expect(splitEmphasis('그냥 문장')).toEqual([{ text: '그냥 문장', strong: false }]);
  });

  /** ⚠ 카피 오타가 화면을 깨뜨리면 안 된다 — 짝이 안 맞는 별표는 글자 그대로 남는다. */
  it('짝이 안 맞는 별표는 강조로 치지 않는다', () => {
    expect(splitEmphasis('**열린 채로 끝난다')).toEqual([{ text: '**열린 채로 끝난다', strong: false }]);
  });

  it('빈 조각은 버린다 — 강조로만 이뤄진 문장에서 빈 span 이 생기지 않게', () => {
    expect(splitEmphasis('**전부 강조**')).toEqual([{ text: '전부 강조', strong: true }]);
  });
});
