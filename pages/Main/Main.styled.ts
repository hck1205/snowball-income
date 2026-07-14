import { globalStyles } from '@/shared/styles';

/**
 * 전역 스타일은 디자인 시스템(`@/shared/styles`)이 소유한다.
 * Main.view.tsx가 `globalStyle`이라는 이름으로 쓰고 있어 그대로 재노출한다.
 */
export const globalStyle = globalStyles;
