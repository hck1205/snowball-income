import { memo } from 'react';
import type { PageFooterProps } from './PageFooter.types';
import { FooterRoot, Note, NotesGroup, NotesTitle, SiteNotice } from './PageFooter.styled';

/**
 * 전 화면 공용 푸터 — **페이지별 각주 슬롯 + 사이트 공통 고지**.
 *
 * 이 컴포넌트가 생기기 전까지 고지는 네 벌로 흩어져 있었다(시뮬레이터 `LandingDisclaimer`,
 * 포트폴리오·캘린더의 각자 `FootNoteCard`, 티커 허브는 아무것도 없음). 2026-07-28 의 "10단계로
 * 미룬다"는 기각 사유가 **소비처가 없다**였는데, 이제 네 화면이 동시에 소비한다.
 *
 * ## 페이지 문구를 합치지 않는다
 * 공통으로 올린 것은 사이트 수준 고지(무료·비자문·비영리) **한 문장뿐**이다. "지급일은 과거 이력에서
 * 계산한 예상일입니다" 같은 문장은 그 화면에서만 참이고, 면책 문구는 법적 성격이 있어 비슷하다는
 * 이유로 뭉뚱그릴 수 없다. 그래서 페이지 문구는 `notes` 슬롯으로 **원문 그대로** 들어온다.
 *
 * ## 법무 문서 링크 — 아직 없다
 * 개인정보처리방침·이용약관 초안은 작성됐지만 미확정 사실(리전·보존기간 등)이 본문에 남아 있어
 * **가계부 브랜치와 함께 보류**했다. 링크는 그 문서가 확정돼 라우트가 생길 때 붙인다 —
 * 없는 페이지로 가는 링크는 404 보다 나쁘다. `PageFooter.styled` 의 `LegalLinks`/`LegalLink` 는
 * 그때 쓰려고 남겨 둔 것이다.
 *
 * ⚠ **`react-router` 의 `Link` 가 아니라 평범한 `a` 다.** 이 컴포넌트는 `MainPage` 가 렌더하고,
 * `MainPage` 를 Router 없이 마운트하는 테스트가 수십 개 있다(test/main/*). `Link` 를 쓰면 공용
 * 컴포넌트 하나가 그 전부에 Router 컨텍스트를 요구하게 된다. 법무 문서는 **읽고 돌아가는 종착지**라
 * 전체 문서 로드가 손해도 아니다. 경로 기반 주소는 그대로이므로(해시 라우팅 아님) 크롤러·OAuth 심사가
 * 보는 URL 도 동일하다.
 *
 * ## 캡처 제외
 * 결과 이미지 저장(캡처 루트 `ResultGrid`)과 PDF 리포트는 각자 자기 루트만 찍으므로 이 푸터는
 * 원래 위치상 걸리지 않는다. 그래도 `data-capture-exclude` 를 명시하는 이유: 앞으로 캡처 루트가
 * 페이지 전체로 넓어져도 **누를 수 없는 링크와 법적 고지가 그림 안에 들어가지 않게** 하기 위해서다
 * (마커의 의미는 "이 결과물엔 넣지 않는다" — `pages/Main/hooks/interaction` 의 `htmlCapture.ts` 참고).
 *
 * ⚠ 마커 이름을 **상수로 import 하지 않고 리터럴로 적는다** — 그 상수는 `pages/Main` 배럴에 있어
 * 공용 컴포넌트가 페이지를 역참조하게 되고(방향이 거꾸로다), 배럴이 캡처·PDF 훅까지 함께 끌고 온다.
 * 대신 `PageFooter.test.ts` 가 이 리터럴이 `CAPTURE_EXCLUDE_ATTRIBUTE` 와 같은지 검사해 단일 출처를
 * 유지한다(두 곳이 어긋나면 테스트가 빨개진다).
 */
const CAPTURE_EXCLUDE = 'data-capture-exclude';

const SITE_NOTICE =
  '무료 배당 재투자 시뮬레이션 계산기입니다. 입력한 가정을 계산해 보여줄 뿐, 투자 자문이 아니며 참고용입니다. 비영리 개인 프로젝트로 유료 기능·광고가 없습니다.';

function PageFooterComponent({ notesTitle, notes, 'aria-label': ariaLabel = '사이트 고지' }: PageFooterProps) {
  const hasNotes = (notes?.length ?? 0) > 0;

  return (
    <FooterRoot aria-label={ariaLabel} {...{ [CAPTURE_EXCLUDE]: '' }}>
      {hasNotes ? (
        <NotesGroup>
          {notesTitle ? <NotesTitle>{notesTitle}</NotesTitle> : null}
          {notes?.map((note, index) => (
            // 각주는 순수 텍스트 목록이라 안정적인 키가 없다 — 순서가 곧 정체성이다(재정렬하지 않는다).
            // eslint-disable-next-line react/no-array-index-key
            <Note key={index}>{note}</Note>
          ))}
        </NotesGroup>
      ) : null}

      <SiteNotice>{SITE_NOTICE}</SiteNotice>
    </FooterRoot>
  );
}

const PageFooter = memo(PageFooterComponent);

export default PageFooter;
