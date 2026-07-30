import { useCallback, useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { prefersReducedMotion } from '@/shared/utils/motion';
import type { ScrollTopButtonProps } from './ScrollTopButton.types';
import { isPastScrollTopThreshold } from './ScrollTopButton.utils';
import { FloatingButton } from './ScrollTopButton.styled';

/** 아이콘 단독 버튼이라 이름은 `aria-label` 이 전부다. */
const LABEL = '맨 위로';

/**
 * 긴 글을 다 읽고 위로 돌아가는 길 — 오른쪽 아래 원형 버튼.
 *
 * - **등장**: 뷰포트 1개분을 내려간 뒤에만(`ScrollTopButton.utils.ts` 에 근거). 임계 아래에서는
 *   렌더 자체를 하지 않는다 — 숨김이 아니라 부재라 스크린리더·탭 순서에도 없다.
 * - **모션**: 등장/퇴장 애니메이션 없음. 이 레포는 퇴장 애니메이션이 0곳이고(DESIGN.md §7),
 *   스크롤 중 새 모션은 "숫자를 읽는 걸 지연시키는 모션" 쪽에 가깝다. 피드백은 누름(`pressable`)과
 *   색 전환만.
 * - **이동**: `prefers-reduced-motion` 이면 즉시 이동한다. 🔴 전역 CSS 리셋은 **CSS 가 정하는
 *   스크롤만** 덮으므로 JS 가 명시한 `behavior` 는 여기서 직접 분기해야 한다(`shared/utils/motion.ts`).
 * - **포커스**: 누르면 버튼이 사라지므로 포커스를 호출부가 지정한 요소(글 제목)로 옮긴다.
 *   `preventScroll` 이 없으면 브라우저가 그 요소로 **즉시** 점프해 부드러운 스크롤이 무의미해진다.
 *   제목(`h1`)에 포커스가 가면 스크린리더가 제목을 읽어 "맨 위로 왔다"가 그대로 전달되므로
 *   별도 live 영역은 두지 않는다.
 */
export default function ScrollTopButton({ focusRef }: ScrollTopButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sync = () => setVisible(isPastScrollTopThreshold(window.scrollY, window.innerHeight));

    // 마운트 시점에 이미 내려가 있을 수 있다(공유 링크로 앵커 위치에 착지, 뒤로가기 스크롤 복원).
    sync();
    window.addEventListener('scroll', sync, { passive: true });
    // 회전·주소창 접힘으로 뷰포트 높이가 바뀌면 임계값도 바뀐다.
    window.addEventListener('resize', sync);

    return () => {
      window.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, []);

  const handleClick = useCallback(() => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    focusRef.current?.focus({ preventScroll: true });
  }, [focusRef]);

  if (!visible) return null;

  return (
    <FloatingButton type="button" aria-label={LABEL} onClick={handleClick}>
      {/* 글자 없이 아이콘만 어포던스인 자리 = ICON.xxl(24). 굵기는 레포 고정값 1.8. */}
      <ArrowUp size={24} strokeWidth={1.8} aria-hidden focusable={false} />
    </FloatingButton>
  );
}
