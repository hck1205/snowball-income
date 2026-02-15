import { memo, useEffect, useLayoutEffect, useRef } from 'react';
import ResponsiveEChartView from './ResponsiveEChart.view';
import type { ResponsiveEChartProps } from './ResponsiveEChart.types';

export const ResponsiveEChart = memo(function ResponsiveEChart({ option, replaceMerge }: ResponsiveEChartProps) {
  const chartRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastSizeRef = useRef({ width: 0, height: 0 });

  const resizeChartToContainer = () => {
    if (!containerRef.current) return;
    const chart = chartRef.current?.getEchartsInstance?.();
    if (!chart) return;

    const rect = containerRef.current.getBoundingClientRect();
    const width = Math.max(0, Math.floor(rect.width));
    const height = Math.max(0, Math.floor(rect.height));
    if (width <= 0 || height <= 0) return;

    const prevSize = lastSizeRef.current;
    if (prevSize.width === width && prevSize.height === height) return;

    lastSizeRef.current = { width, height };
    chart.resize({ width, height, animation: { duration: 0 } });
  };

  const queueMeasure = () => {
    if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    rafRef.current = window.requestAnimationFrame(() => {
      resizeChartToContainer();
      rafRef.current = null;
    });
  };

  useLayoutEffect(() => {
    const viewport = window.visualViewport;
    const observer =
      typeof ResizeObserver !== 'undefined' && containerRef.current
        ? new ResizeObserver(() => {
            queueMeasure();
          })
        : null;

    if (observer && containerRef.current) observer.observe(containerRef.current);
    window.addEventListener('resize', queueMeasure);
    window.addEventListener('orientationchange', queueMeasure);
    viewport?.addEventListener('resize', queueMeasure);

    const timer = window.setTimeout(() => queueMeasure(), 80);
    const timer2 = window.setTimeout(() => queueMeasure(), 220);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(timer2);
      observer?.disconnect();
      window.removeEventListener('resize', queueMeasure);
      window.removeEventListener('orientationchange', queueMeasure);
      viewport?.removeEventListener('resize', queueMeasure);
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => queueMeasure());
    return () => window.cancelAnimationFrame(raf);
  }, [option]);

  return (
    <ResponsiveEChartView
      chartRef={chartRef}
      containerRef={containerRef}
      option={option}
      replaceMerge={replaceMerge}
    />
  );
});
