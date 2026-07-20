import { beforeAll, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RichTextEditor } from '@/components/community/RichTextEditor';
import { sanitizeRichHtml } from '@/shared/lib/richtext';
import { COMMUNITY_COPY } from '@/shared/constants/community';

const c = COMMUNITY_COPY.write;

/**
 * 툴바 확장(7→14 버튼) 회귀 방지.
 *
 * 핵심은 **왕복**이다 — 툴바 버튼을 실제로 눌러 나온 HTML을 그대로 `sanitizeRichHtml`에 통과시켜
 * 서식이 저장 후에도 살아남는지 본다. 태그를 손으로 적은 픽스처는 "에디터가 진짜 그 태그를 만드는가"를
 * 증명하지 못하므로, 여기서는 반드시 클릭 → getHTML → sanitize 순서로 검증한다.
 */

/**
 * jsdom에는 `document.elementFromPoint`가 없다 — ProseMirror의 mousedown 핸들러(posAtCoords)가
 * 이걸 무조건 호출하므로 폴리필이 없으면 에디터 본문 클릭이 TypeError로 죽는다.
 * null을 돌려주면 PM이 자체 폴백(getBoundingClientRect 기반 탐색)으로 위치를 잡는다.
 */
beforeAll(() => {
  if (!document.elementFromPoint) {
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: () => null });
  }

  /**
   * ProseMirror는 트랜잭션마다 scrollToSelection → coordsAtPos에서 텍스트 노드/Range의
   * `getClientRects()`를 읽는다. jsdom의 Text 노드에는 이 메서드가 없어 rAF 콜백 안에서
   * uncaught TypeError가 쏟아진다(테스트는 통과하지만 타이밍이 바뀌면 실패로 승격된다).
   * 0크기 rect 하나를 돌려주면 좌표 계산이 조용히 끝난다.
   */
  const emptyRect = { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 };
  const protos = [Text.prototype, Range.prototype] as unknown as Array<Record<string, unknown>>;
  for (const proto of protos) {
    if (typeof proto.getClientRects !== 'function') {
      Object.defineProperty(proto, 'getClientRects', { configurable: true, value: () => [emptyRect] });
    }
    if (typeof proto.getBoundingClientRect !== 'function') {
      Object.defineProperty(proto, 'getBoundingClientRect', { configurable: true, value: () => emptyRect });
    }
  }
});

type Harness = {
  user: ReturnType<typeof userEvent.setup>;
  /** onChange로 마지막에 올라온 본문 HTML. */
  latestHtml: () => string;
  toolbar: HTMLElement;
};

const renderEditor = async (initialHtml = ''): Promise<Harness> => {
  const user = userEvent.setup();
  let html = initialHtml;

  render(
    <RichTextEditor
      initialHtml={initialHtml}
      onChange={(next) => {
        html = next;
      }}
      ariaLabel={c.bodyAriaLabel}
    />
  );

  // useEditor({ immediatelyRender: false })라 첫 렌더에는 툴바가 없다.
  const toolbar = await screen.findByRole('toolbar', { name: c.toolbarAriaLabel });

  return { user, latestHtml: () => html, toolbar };
};

const clickTool = async (harness: Harness, label: string) => {
  await harness.user.click(within(harness.toolbar).getByRole('button', { name: label }));
};

const body = () => screen.getByRole('textbox', { name: c.bodyAriaLabel });

describe('RichTextEditor — 툴바 구성', () => {
  /**
   * 실측 15개다 (서식 5 + 문단 4 + 목록 2 + 삽입 2 + 이력 2).
   * "7→14 확장"이라는 서술과 어긋나지만 구현/카피가 일관되므로 실제 값으로 고정한다.
   */
  it('툴바에 15개 버튼이 5개 그룹으로 노출된다', async () => {
    const harness = await renderEditor();

    expect(within(harness.toolbar).getAllByRole('button')).toHaveLength(15);
    expect(within(harness.toolbar).getAllByRole('group')).toHaveLength(5);
  });

  it('그룹별 버튼 수가 설계(5/4/2/2/2)와 일치한다', async () => {
    const harness = await renderEditor();
    const countIn = (name: string) =>
      within(within(harness.toolbar).getByRole('group', { name })).getAllByRole('button').length;

    expect(countIn(c.toolbarGroupInline)).toBe(5);
    expect(countIn(c.toolbarGroupBlock)).toBe(4);
    expect(countIn(c.toolbarGroupList)).toBe(2);
    expect(countIn(c.toolbarGroupInsert)).toBe(2);
    expect(countIn(c.toolbarGroupHistory)).toBe(2);
  });

  it('각 그룹이 한국어 접근명을 갖는다', async () => {
    const harness = await renderEditor();

    for (const name of [
      c.toolbarGroupInline,
      c.toolbarGroupBlock,
      c.toolbarGroupList,
      c.toolbarGroupInsert,
      c.toolbarGroupHistory
    ]) {
      expect(within(harness.toolbar).getByRole('group', { name })).toBeInTheDocument();
    }
  });

  it('신규 서식 버튼이 접근명으로 모두 찾아진다', async () => {
    const harness = await renderEditor();

    for (const label of [
      c.bold,
      c.italic,
      c.underline,
      c.strike,
      c.inlineCode,
      c.heading2,
      c.heading3,
      c.blockquote,
      c.codeBlock,
      c.bulletList,
      c.orderedList,
      c.link,
      c.horizontalRule,
      c.undo,
      c.redo
    ]) {
      expect(within(harness.toolbar).getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('title(툴팁)에는 단축키가 붙고 접근명(aria-label)은 라벨만 남는다', async () => {
    const harness = await renderEditor();
    const bold = within(harness.toolbar).getByRole('button', { name: c.bold });

    expect(bold).toHaveAttribute('title', `${c.bold} (${c.shortcutBold})`);
    expect(bold).toHaveAttribute('aria-label', c.bold);
  });

  it('단축키가 없는 버튼(구분선)의 title은 라벨 그대로다', async () => {
    const harness = await renderEditor();

    expect(within(harness.toolbar).getByRole('button', { name: c.horizontalRule })).toHaveAttribute(
      'title',
      c.horizontalRule
    );
  });
});

describe('RichTextEditor — aria-pressed 토글', () => {
  const TOGGLES: ReadonlyArray<{ label: string; shouldPress: boolean }> = [
    { label: c.bold, shouldPress: true },
    { label: c.italic, shouldPress: true },
    { label: c.underline, shouldPress: true },
    { label: c.strike, shouldPress: true },
    { label: c.inlineCode, shouldPress: true },
    { label: c.heading2, shouldPress: true },
    { label: c.heading3, shouldPress: true },
    { label: c.blockquote, shouldPress: true },
    { label: c.codeBlock, shouldPress: true },
    { label: c.bulletList, shouldPress: true },
    { label: c.orderedList, shouldPress: true }
  ];

  it.each(TOGGLES)('$label 버튼은 초기에 aria-pressed=false 다', async ({ label }) => {
    const harness = await renderEditor();
    expect(within(harness.toolbar).getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'false');
  });

  it.each(TOGGLES)('$label 버튼을 누르면 aria-pressed=true 로 바뀐다', async ({ label }) => {
    const harness = await renderEditor('<p>본문</p>');

    await harness.user.click(body());
    await clickTool(harness, label);

    expect(within(harness.toolbar).getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true');
  });

  it('한 번 더 누르면 aria-pressed=false 로 돌아온다', async () => {
    const harness = await renderEditor('<p>본문</p>');

    await harness.user.click(body());
    await clickTool(harness, c.underline);
    expect(within(harness.toolbar).getByRole('button', { name: c.underline })).toHaveAttribute('aria-pressed', 'true');

    await clickTool(harness, c.underline);
    expect(within(harness.toolbar).getByRole('button', { name: c.underline })).toHaveAttribute('aria-pressed', 'false');
  });

  it('삽입/이력 버튼(구분선·실행 취소·다시 실행)에는 aria-pressed가 없다', async () => {
    const harness = await renderEditor();

    for (const label of [c.horizontalRule, c.undo, c.redo]) {
      expect(within(harness.toolbar).getByRole('button', { name: label })).not.toHaveAttribute('aria-pressed');
    }
  });
});

describe('RichTextEditor — 실행 취소 / 다시 실행', () => {
  it('초기에는 실행 취소·다시 실행이 모두 비활성이다', async () => {
    const harness = await renderEditor();

    expect(within(harness.toolbar).getByRole('button', { name: c.undo })).toBeDisabled();
    expect(within(harness.toolbar).getByRole('button', { name: c.redo })).toBeDisabled();
  });

  /**
   * 편집 행위는 "구분선 삽입"으로 만든다 — jsdom에서 contenteditable 타이핑은 ProseMirror의
   * DOM 관찰과 어긋나 유실되지만(아래 왕복 스위트 주석 참고), 툴바 커맨드는 결정적이다.
   */
  it('문서를 편집하면 실행 취소가 활성화된다', async () => {
    const harness = await renderEditor('<p>본문</p>');

    await clickTool(harness, c.horizontalRule);

    expect(within(harness.toolbar).getByRole('button', { name: c.undo })).toBeEnabled();
  });

  it('실행 취소를 누르면 편집이 되돌아가고 다시 실행이 활성화된다', async () => {
    const harness = await renderEditor('<p>본문</p>');

    await clickTool(harness, c.horizontalRule);
    expect(harness.latestHtml().toLowerCase()).toContain('<hr');

    await clickTool(harness, c.undo);

    expect(harness.latestHtml().toLowerCase()).not.toContain('<hr');
    expect(within(harness.toolbar).getByRole('button', { name: c.redo })).toBeEnabled();
  });

  it('다시 실행을 누르면 되돌린 편집이 복구된다', async () => {
    const harness = await renderEditor('<p>본문</p>');

    await clickTool(harness, c.horizontalRule);
    await clickTool(harness, c.undo);
    await clickTool(harness, c.redo);

    expect(harness.latestHtml().toLowerCase()).toContain('<hr');
  });
});

describe('RichTextEditor → sanitize 왕복 (툴바에서 만든 서식이 저장 후에도 남는가)', () => {
  /**
   * "본문을 전체 선택하고 서식 버튼을 누른다"는 실제 사용자 순서로 구동한다.
   *
   * ⚠ jsdom에서 contenteditable에 직접 타이핑(user.keyboard)하면 ProseMirror의 DOM 관찰과 어긋나
   * 글자가 유실된다(실측: '내용' → '용'). 반면 Ctrl+A 선택 + 툴바 커맨드는 ProseMirror 트랜잭션이라
   * 결정적이다 — 그래서 "타이핑" 대신 "선택 후 서식 적용"으로 같은 결과를 얻는다.
   */
  const CASES: ReadonlyArray<{ label: string; tag: string }> = [
    { label: c.bold, tag: 'strong' },
    { label: c.italic, tag: 'em' },
    { label: c.underline, tag: 'u' },
    { label: c.strike, tag: 's' },
    { label: c.inlineCode, tag: 'code' },
    { label: c.heading2, tag: 'h2' },
    { label: c.heading3, tag: 'h3' },
    { label: c.blockquote, tag: 'blockquote' },
    { label: c.codeBlock, tag: 'pre' },
    { label: c.bulletList, tag: 'ul' },
    { label: c.orderedList, tag: 'ol' }
  ];

  it.each(CASES)('$label → <$tag> 가 에디터 출력과 sanitize 결과 양쪽에 남는다', async ({ label, tag }) => {
    const harness = await renderEditor('<p>내용</p>');

    // 전체 선택(Ctrl+A) 전에 본문에 포커스가 있어야 ProseMirror가 키를 받는다.
    await harness.user.click(body());
    await harness.user.keyboard('{Control>}a{/Control}');
    await clickTool(harness, label);

    const produced = harness.latestHtml();
    expect(produced.toLowerCase(), `에디터가 <${tag}>를 만들지 않음: ${produced}`).toContain(`<${tag}`);

    const saved = sanitizeRichHtml(produced);
    expect(saved.toLowerCase(), `sanitize가 <${tag}>를 삼킴: ${saved}`).toContain(`<${tag}`);
    expect(saved, `sanitize 후 본문 텍스트가 사라짐: ${saved}`).toContain('내용');
  });

  it('구분선 버튼은 <hr>을 삽입하고 sanitize를 통과한다', async () => {
    const harness = await renderEditor('<p>위 문단</p>');

    await clickTool(harness, c.horizontalRule);

    const produced = harness.latestHtml();
    expect(produced.toLowerCase()).toContain('<hr');

    const saved = sanitizeRichHtml(produced);
    expect(saved.toLowerCase()).toContain('<hr');
    expect(saved).toContain('위 문단');
  });

  it('링크를 걸면 href가 sanitize 후에도 남고 rel/target이 강제된다', async () => {
    const harness = await renderEditor('<p>출처</p>');

    // 전체 선택(Ctrl+A) 전에 본문에 포커스가 있어야 ProseMirror가 키를 받는다.
    await harness.user.click(body());
    await harness.user.keyboard('{Control>}a{/Control}');
    await clickTool(harness, c.link);

    await harness.user.type(screen.getByRole('textbox', { name: c.link }), 'https://example.com');
    await harness.user.click(screen.getByRole('button', { name: c.linkApply }));

    const saved = sanitizeRichHtml(harness.latestHtml());
    expect(saved).toContain('href="https://example.com"');
    expect(saved).toContain('target="_blank"');
    expect(saved).toMatch(/rel="[^"]*noopener[^"]*"/);
  });

  it('여러 서식을 겹쳐 써도 모두 살아남는다 (굵게 + 밑줄 + 취소선)', async () => {
    const harness = await renderEditor('<p>겹침</p>');

    // 전체 선택(Ctrl+A) 전에 본문에 포커스가 있어야 ProseMirror가 키를 받는다.
    await harness.user.click(body());
    await harness.user.keyboard('{Control>}a{/Control}');
    await clickTool(harness, c.bold);
    await clickTool(harness, c.underline);
    await clickTool(harness, c.strike);

    const saved = sanitizeRichHtml(harness.latestHtml()).toLowerCase();
    expect(saved).toContain('<strong');
    expect(saved).toContain('<u');
    expect(saved).toContain('<s');
  });
});

describe('RichTextEditor — 기존 본문 하위 호환', () => {
  it('확장 이전에 저장된 본문을 열면 서식이 그대로 보인다', async () => {
    const legacy =
      '<h2>내 전략</h2><p><strong>SCHD</strong> 위주</p><ul><li><p>매달 100만원</p></li></ul>';
    const harness = await renderEditor(legacy);

    const editorBody = body();
    expect(within(editorBody).getByRole('heading', { level: 2, name: '내 전략' })).toBeInTheDocument();
    expect(editorBody.querySelector('strong')?.textContent).toBe('SCHD');
    expect(editorBody.querySelector('ul')).not.toBeNull();
    expect(harness.toolbar).toBeInTheDocument();
  });

  it('구 본문에서 커서를 굵은 글자에 두면 굵게 버튼이 눌림 상태로 표시된다', async () => {
    const harness = await renderEditor('<p><strong>굵은글자</strong></p>');

    await harness.user.click(screen.getByText('굵은글자'));

    expect(within(harness.toolbar).getByRole('button', { name: c.bold })).toHaveAttribute('aria-pressed', 'true');
  });
});
