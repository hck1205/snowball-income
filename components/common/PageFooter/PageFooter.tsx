import { memo } from 'react';
import { createPortal } from 'react-dom';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { usePageFooterSlot } from '../PageFooterSlot';
import type { PageFooterProps } from './PageFooter.types';
import {
  BrandMark,
  FooterMasthead,
  FooterRoot,
  LegalLink,
  LegalLinks,
  Note,
  NotesGroup,
  NotesTitle,
  PanelRule,
  SiteNotice
} from './PageFooter.styled';

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
 * ## 법무 문서 링크
 * 개인정보처리방침(`/privacy`)·이용약관(`/terms`)으로 가는 유일한 상시 진입점이다. 헤더 nav 에는
 * 넣지 않는다 — 읽으러 오는 문서가 아니라 **필요할 때 찾을 수 있어야 하는** 문서라 자리는 푸터가 맞다.
 * 두 문서는 소셜 로그인·커뮤니티·클라우드 저장을 쓰는 사용자에게 실제로 적용되고, 구글 OAuth 동의
 * 화면 심사도 방침 URL 을 직접 연다.
 *
 * ⚠ **`react-router` 의 `Link` 가 아니라 평범한 `a` 다.** 이 컴포넌트는 `MainPage` 가 렌더하고,
 * `MainPage` 를 Router 없이 마운트하는 테스트가 수십 개 있다(test/main/*). `Link` 를 쓰면 공용
 * 컴포넌트 하나가 그 전부에 Router 컨텍스트를 요구하게 된다. 법무 문서는 **읽고 돌아가는 종착지**라
 * 전체 문서 로드가 손해도 아니다. 경로 기반 주소는 그대로이므로(해시 라우팅 아님) 크롤러·OAuth 심사가
 * 보는 URL 도 동일하다.
 *
 * ## 브랜드 패널 (2026-08-03)
 * 이 푸터는 **매 화면 하단에 서는 유일한 브랜드 면**이다. 라이트 테마의 제품 화면에는 금색이 한
 * 픽셀도 없었는데(밝은 면 위 금색은 1.83:1), 금색이 합법인 유일한 조합이 네이비 패널 위다.
 * 그래서 심볼(하마)·법무 링크·구분선이 금색으로 여기 산다 — 모양·대비 근거는 `PageFooter.styled.ts`.
 * 🔴 금색을 이 패널 밖으로 꺼내지 마라.
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

/**
 * 법무 문서 링크. 경로는 `router/routes.tsx` 의 `/privacy`·`/terms` 와 짝이고,
 * `PageFooter.test.ts` 가 이 href 계약을 지킨다(주소가 바뀌면 심사·고지 링크가 함께 죽는다).
 */
const LEGAL_LINKS = [
  { href: '/privacy', label: '개인정보처리방침' },
  { href: '/terms', label: '이용약관' }
] as const;

/**
 * 제품명. 🔴 **링크로 만들지 않는다** — 브랜드 링크는 헤더 워드마크 하나뿐이라는 계약이 있고
 * (`test/community/PrimaryNav.test.tsx`), 같은 접근명을 가진 링크가 둘이 되면 그 계약이 모호해진다.
 * 값은 내비 워드마크와 **같은 출처**를 쓴다 — 제품명이 두 곳에서 갈리지 않게.
 */
const BRAND_NAME = COMMUNITY_COPY.nav.brand;

function PageFooterComponent({ notesTitle, notes, 'aria-label': ariaLabel = '사이트 고지' }: PageFooterProps) {
  const hasNotes = (notes?.length ?? 0) > 0;
  /*
   * 🔴 셸이 열어 준 자리로 **DOM 만** 옮긴다(`PageFooterSlot.tsx` 에 이유 전문).
   * 요약: `<footer>` 가 `<main>` 의 자손이면 contentinfo 랜드마크가 죽고, 셸의 main 이
   * max-width 1200 이라 전폭 띠도 될 수 없다. 각주는 뷰의 상태에서 나오므로 호출부는 그대로 둔다.
   * ⚠ 슬롯이 없으면(시뮬레이터·커뮤니티·테스트) 제자리에 그린다 — 기능이 사라지지 않는다.
   */
  const slot = usePageFooterSlot();

  const tree = (
    <FooterRoot aria-label={ariaLabel} {...{ [CAPTURE_EXCLUDE]: '' }}>
      <FooterMasthead>
        <BrandMark>
          {BRAND_NAME}
        </BrandMark>

        <LegalLinks aria-label="법적 고지 문서">
          {LEGAL_LINKS.map(({ href, label }) => (
            <LegalLink key={href} href={href}>
              {label}
            </LegalLink>
          ))}
        </LegalLinks>
      </FooterMasthead>

      <PanelRule aria-hidden />

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

  return slot ? createPortal(tree, slot) : tree;
}

const PageFooter = memo(PageFooterComponent);

export default PageFooter;
