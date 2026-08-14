import type { LucideIcon } from 'lucide-react';

/**
 * nav 목적지 하나. `Icon` 은 lucide 아이콘 컴포넌트다.
 * ⚠ `import type` 이어야 한다 — 값으로 가져오면 타입 하나 때문에 아이콘 모듈이 엔트리에 실린다.
 */
export type NavLeaf = { to: string; label: string; Icon: LucideIcon };

/** 이름 붙은 목적지 묶음. 사이트맵의 '정책'처럼 nav 밖에서도 쓰인다(그쪽은 아이콘이 없다). */
export type NavGroup = { label: string; items: readonly NavLeaf[] };

/**
 * 헤더 윗줄의 한 칸. 🔴 **목적지가 아니다** — 눌러도 이동하지 않고 자식을 펼친다.
 *
 * 🔴 칸은 **전부 같은 모양**이다(2026-08-14). 한 칸만 여러 열을 가진 판(메가메뉴)으로 열게 했다가
 *    되돌렸다 — 형제 중 하나만 다르게 동작하면 사용자가 배운 규칙("누르면 목록이 떨어진다")이
 *    깨진다. 자식이 많아지면 판을 키우지 말고 **칸을 나눠라**.
 */
export type NavColumn = NavGroup & { Icon: LucideIcon };

export type PrimaryNavProps = {
  /**
   * 브랜드 워드마크를 감쌀 태그.
   * 시뮬레이터(메인) 헤더에선 'h1'로 랜드마크 제목을 겸한다(페이지당 1개). 커뮤니티 헤더 등은 'span'(기본).
   */
  brandAs?: 'h1' | 'span';
  /**
   * 라우트 링크를 함께 렌더할지. 헤더 2줄 개편(2026-07-25) 후 두 헤더 모두 링크를 아래 줄의
   * `PrimaryNavLinks` 로 옮겼다 — 윗줄에는 브랜드만 남기려면 false.
   */
  withLinks?: boolean;
};
