export type LikeButtonProps = {
  liked: boolean;
  count: number;
  onToggle: () => void;
  disabled?: boolean;
  /** sm=밀도 높은 자리(카드/댓글), md=상세 헤더. */
  size?: 'sm' | 'md';
};
