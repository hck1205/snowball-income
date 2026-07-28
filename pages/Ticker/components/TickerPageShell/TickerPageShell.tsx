import { PrimaryNav, PrimaryNavLinks } from '@/components/PrimaryNav';
import type { TickerPageShellProps } from './TickerPageShell.types';
import { ShellHeader, ShellHeaderInner, ShellMain, ShellRoot } from './TickerPageShell.styled';

/**
 * 티커 SEO 페이지(허브·상세)의 공통 크롬 — 전역 `PrimaryNav`(브랜드 워드마크 + 주요 nav)를 그대로 재사용해
 * 시뮬레이터/커뮤니티 헤더와 워드마크·링크가 완전히 일치한다.
 *
 * `brandAs` 는 기본값 'span' — 상세 페이지의 유일 `<h1>` 은 히어로의 티커 제목이어야 하므로 헤더
 * 워드마크는 제목을 겸하지 않는다. PrimaryNav 는 엔트리 번들 소속이라 이 재사용으로 새 청크가 생기지 않는다.
 */
export default function TickerPageShell({ children }: TickerPageShellProps) {
  return (
    <ShellRoot>
      <ShellHeader>
        <ShellHeaderInner>
          {/* 헤더 2줄 개편(2026-07-25)과 동일 조립 — 브랜드 윗줄 + 메뉴 아랫줄(가운데·스크롤).
              세 헤더(시뮬레이터·커뮤니티·티커 셸)가 같은 조각을 같은 순서로 조립해야 한 화면처럼 보인다. */}
          <PrimaryNav withLinks={false} />
          <PrimaryNavLinks />
        </ShellHeaderInner>
      </ShellHeader>
      <ShellMain>{children}</ShellMain>
    </ShellRoot>
  );
}
