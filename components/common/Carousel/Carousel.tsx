import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ICON } from '@/shared/styles';
import type { CarouselProps } from './Carousel.types';
import {
  CarouselArrow,
  CarouselArrows,
  CarouselCount,
  CarouselDot,
  CarouselDots,
  CarouselFoot,
  CarouselRoot,
  CarouselTrack
} from './Carousel.styled';

/**
 * 긴 목록을 **가로 한 줄로 접는** 캐러셀.
 *
 * ## 왜 있나
 * 🔴 목적은 "생기"가 아니라 **한 번에 보이는 양을 줄이는 것**이다(2026-08-07 사용자). 카드가
 * 열 장 넘게 세로로 늘어서면 처음 온 사람은 그 길이만 보고 나간다 — 같은 정보를 가로로 접으면
 * 화면 한 칸이 되고 페이지가 그만큼 짧아진다.
 *
 * ## 구현이 네이티브 스크롤인 이유
 * 🔴 transform 페이징으로 만들지 않는다. 그러면 터치 스와이프·관성·키보드 스크롤·포커스 이동을
 * 전부 손으로 다시 만들어야 하고, 카드 폭이 가변이면 그 계산이 어긋난다. 여기서 우리가 하는 일은
 * **스크롤 위치를 읽어 점을 칠하고, 버튼이 한 칸씩 밀어 주는 것**뿐이다.
 *
 * ## 자동 넘김
 * 기본은 **꺼짐**이다 — 자동으로 움직이는 화면은 읽는 속도를 사용자에게서 뺏는다. 켜더라도
 * hover·포커스·터치에 멈추고, 움직임 축소 설정에서는 아예 돌지 않는다.
 *
 * ⚠ 끝에 닿은 화살표는 **숨기지 않고 비활성화**한다 — 사라지면 옆 버튼이 그 자리로 밀려와
 *   연달아 누르던 손가락이 다른 버튼을 누른다.
 */
export default function Carousel({ children, ariaLabel, autoAdvanceSeconds = 0, className }: CarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [paused, setPaused] = useState(false);

  /**
   * 스크롤 위치 → 몇 번째 칸인가.
   * ⚠ 마지막 칸은 나머지가 한 화면에 못 미쳐 딱 떨어지지 않는다 — 그래서 반올림하고 상한을 건다.
   */
  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const { scrollLeft, clientWidth, scrollWidth } = track;
    const count = Math.max(1, Math.ceil(scrollWidth / Math.max(1, clientWidth)));
    setPageCount(count);
    setPage(Math.min(count - 1, Math.round(scrollLeft / Math.max(1, clientWidth))));
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    measure();
    track.addEventListener('scroll', measure, { passive: true });

    /* 카드가 늘거나 폭이 바뀌면 칸 수가 달라진다 — 마운트 1회 측정으로는 점이 거짓말을 한다. */
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(track);

    return () => {
      track.removeEventListener('scroll', measure);
      observer?.disconnect();
    };
  }, [measure, children]);

  const goTo = useCallback((target: number) => {
    const track = trackRef.current;
    if (!track) return;
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    track.scrollTo({ left: target * track.clientWidth, behavior: reduced ? 'auto' : 'smooth' });
  }, []);

  /* 자동 넘김. 끝에 닿으면 처음으로 돌아온다 — 멈춰 서 있으면 "고장 났다"로 읽힌다. */
  useEffect(() => {
    if (autoAdvanceSeconds <= 0 || paused || pageCount <= 1) return undefined;
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setPage((current) => {
        const next = current + 1 >= pageCount ? 0 : current + 1;
        goTo(next);
        return next;
      });
    }, autoAdvanceSeconds * 1_000);

    return () => window.clearInterval(timer);
  }, [autoAdvanceSeconds, goTo, pageCount, paused]);

  const atStart = page <= 0;
  const atEnd = page >= pageCount - 1;

  return (
    <CarouselRoot
      className={className}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      /* 터치는 hover 가 없다 — 손이 닿는 동안은 멈춘다. */
      onTouchStart={() => setPaused(true)}
    >
      <CarouselTrack ref={trackRef} aria-label={ariaLabel}>
        {children}
      </CarouselTrack>

      {/* 칸이 하나뿐이면 조작할 것이 없다 — 점 하나와 죽은 화살표만 남는 줄을 그리지 않는다. */}
      {pageCount > 1 ? (
        <CarouselFoot>
          <CarouselDots>
            {Array.from({ length: pageCount }, (_, index) => (
              <CarouselDot
                key={index}
                type="button"
                $active={index === page}
                aria-label={`${index + 1}번째`}
                aria-current={index === page ? 'true' : undefined}
                onClick={() => goTo(index)}
              />
            ))}
          </CarouselDots>

          <CarouselArrows>
            <CarouselCount>
              {page + 1} / {pageCount}
            </CarouselCount>
            <CarouselArrow type="button" aria-label="이전" disabled={atStart} onClick={() => goTo(page - 1)}>
              <ChevronLeft size={ICON.sm} strokeWidth={ICON.stroke} aria-hidden focusable={false} />
            </CarouselArrow>
            <CarouselArrow type="button" aria-label="다음" disabled={atEnd} onClick={() => goTo(page + 1)}>
              <ChevronRight size={ICON.sm} strokeWidth={ICON.stroke} aria-hidden focusable={false} />
            </CarouselArrow>
          </CarouselArrows>
        </CarouselFoot>
      ) : null}
    </CarouselRoot>
  );
}
