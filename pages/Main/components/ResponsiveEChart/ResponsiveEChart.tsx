import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import ResponsiveEChartView from './ResponsiveEChart.view';
import type { ResponsiveEChartProps } from './ResponsiveEChart.types';

export const ResponsiveEChart = memo(function ResponsiveEChart({ option, replaceMerge }: ResponsiveEChartProps) {
  const chartRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });

  const measureContainer = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = Math.max(0, Math.floor(rect.width));
    const height = Math.max(0, Math.floor(rect.height));
    setChartSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  };

  const queueMeasure = () => {
    if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    rafRef.current = window.requestAnimationFrame(() => {
      measureContainer();
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

  useEffect(() => {
    const chart = chartRef.current?.getEchartsInstance?.();
    if (!chart) return;
    if (chartSize.width <= 0 || chartSize.height <= 0) return;
    chart.resize({ width: chartSize.width, height: chartSize.height });
  }, [chartSize.height, chartSize.width]);

  return (
    <ResponsiveEChartView
      chartRef={chartRef}
      containerRef={containerRef}
      height={chartSize.height}
      option={option}
      replaceMerge={replaceMerge}
      width={chartSize.width}
    />
  );
});
