import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { CAPTURE_EXCLUDE_ATTRIBUTE } from '@/pages/Main/hooks/interaction';
import PageFooter from './PageFooter';

/**
 * 공용 푸터의 세 계약.
 *
 * ① **상시 노출 고지** — 구 `pages/Main/components/LandingDisclaimer` 가 지키던 것을 그대로 승계한다
 *    (그 컴포넌트는 이 푸터로 수렴하며 삭제됐다). 네이버 재검수·일반 방문자가 URL 만 열어도
 *    클릭·펼치기 없이 "무료 계산기 · 비자문 · 비영리"를 읽을 수 있어야 한다.
 * ② **페이지 각주는 슬롯으로 원문 그대로** — 면책 문구는 법적 성격이 있어 합치거나 고쳐 쓰지 않는다.
 * ③ 🔴 **결과 이미지 저장에 끼지 않는다** — 캡처 파이프라인은 `data-capture-exclude` 가 붙은 요소를
 *    직렬화 단계에서 건너뛴다. 이 테스트는 푸터가 적어 둔 **리터럴**이 파이프라인의 상수와 같은지
 *    확인한다(푸터는 그 상수를 import 하지 않는다 — 공용 컴포넌트가 페이지를 역참조하지 않으려고).
 */
describe('PageFooter', () => {
  it('클릭·펼치기 없이 사이트 공통 고지가 보인다', () => {
    render(createElement(PageFooter));

    expect(screen.getByText(/무료 배당 재투자 시뮬레이션/)).toBeInTheDocument();
    expect(screen.getByText(/투자 자문이 아니며/)).toBeInTheDocument();
    expect(screen.getByText(/비영리 개인 프로젝트/)).toBeInTheDocument();
  });

  /**
   * ⚠ **랜드마크가 되는지는 놓이는 자리에 달렸다** — `<footer>` 는 `main`/`section`/`article` 의
   * 자손이면 `contentinfo` 가 아니라 `generic` 이다(HTML-AAM). 시뮬레이터(`/`)는 `<main>` 밖에 두어
   * 랜드마크가 되고, `TickerPageShell` 을 쓰는 세 화면은 `<main>` 안이라 그렇지 않다 — 이건 이 컴포넌트
   * 이전부터 있던 비대칭이고(구 `LandingDisclaimer` vs 구 `FootNoteCard`) 이번에 바꾸지 않았다.
   * 없애려면 셸에 `footer` 슬롯을 뚫어 `</ShellMain>` 뒤로 옮겨야 한다(후속 과제).
   * 여기서는 **컴포넌트 자신의 계약**(요소·접근명)만 본다.
   */
  it('접근명 "사이트 고지"를 가진 footer 다', () => {
    render(createElement(PageFooter));

    const footer = screen.getByRole('contentinfo', { name: /사이트 고지/ });
    expect(footer).toHaveTextContent(/투자 자문이 아니며/);
  });

  it('페이지 각주는 넘긴 문구 그대로 나온다', () => {
    render(
      createElement(PageFooter, {
        notesTitle: '이 숫자에 대해',
        notes: ['지급일은 과거 지급 이력에서 계산한 예상일입니다.', '이 화면은 투자 자문이 아닙니다.']
      })
    );

    expect(screen.getByText('이 숫자에 대해')).toBeInTheDocument();
    expect(screen.getByText('지급일은 과거 지급 이력에서 계산한 예상일입니다.')).toBeInTheDocument();
  });

  it('각주가 없으면 제목도 그리지 않는다 — 빈 껍데기를 남기지 않는다', () => {
    render(createElement(PageFooter, { notesTitle: '이 숫자에 대해' }));

    expect(screen.queryByText('이 숫자에 대해')).not.toBeInTheDocument();
  });

  it('🔴 결과 이미지 저장에서 제외된다 (data-capture-exclude)', () => {
    render(createElement(PageFooter));

    const footer = screen.getByRole('contentinfo');

    // 파이프라인의 판정과 **같은 술어**로 본다(htmlCapture 의 filter: node.hasAttribute(...)).
    expect(footer.hasAttribute(CAPTURE_EXCLUDE_ATTRIBUTE)).toBe(true);
    // 마커 이름이 갈리면 푸터만 조용히 그림 안에 남는다 — 리터럴과 상수를 여기서 묶어 둔다.
    expect(CAPTURE_EXCLUDE_ATTRIBUTE).toBe('data-capture-exclude');
  });
});
