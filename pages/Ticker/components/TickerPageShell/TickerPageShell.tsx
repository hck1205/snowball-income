import { PrimaryNav } from '@/components/PrimaryNav';
import type { TickerPageShellProps } from './TickerPageShell.types';
import { ShellHeader, ShellHeaderInner, ShellMain, ShellRoot } from './TickerPageShell.styled';

/**
 * 티커 SEO 페이지(허브·상세)의 공통 크롬 — 전역 `PrimaryNav`(로고+워드마크+주요 nav)를 그대로 재사용해
 * 시뮬레이터/커뮤니티 헤더와 로고·링크가 완전히 일치한다.
 *
 * `brandAs` 는 기본값 'span' — 상세 페이지의 유일 `<h1>` 은 히어로의 티커 제목이어야 하므로 헤더
 * 워드마크는 제목을 겸하지 않는다. PrimaryNav 는 엔트리 번들 소속이라 이 재사용으로 새 청크가 생기지 않는다.
 */
export default function TickerPageShell({ children }: TickerPageShellProps) {
  return (
    <ShellRoot>
      <ShellHeader>
        <ShellHeaderInner>
          <PrimaryNav />
        </ShellHeaderInner>
      </ShellHeader>
      <ShellMain>{children}</ShellMain>
    </ShellRoot>
  );
}
