import { CHART_SERIES } from '@/shared/styles';

/**
 * 포트폴리오 비중 차트/범례 색.
 * 값만 디자인 시스템 팔레트로 교체했다 — 개수(8)와 순서 의미는 그대로다.
 * (기존: 네온톤 #4cc9f0 / #70e000 / #ffd166 … → 채도를 낮춰 라이트·다크 양쪽에서 구분되게)
 */
export const ALLOCATION_COLORS: string[] = [...CHART_SERIES];
