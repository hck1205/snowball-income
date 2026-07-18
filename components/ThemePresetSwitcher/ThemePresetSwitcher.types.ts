/**
 * popover — 데스크톱 헤더용. Palette 아이콘 트리거를 누르면 radiogroup 팝오버가 열린다.
 *           드로어 브레이크포인트(960px) 이하에서는 렌더만 되고 숨겨진다(진입점은 드로어 인라인).
 * inline  — 모바일 드로어 상단용. 팝오버 없이 radiogroup을 그대로 펼친다
 *           (드로어 안에 팝오버를 중첩하지 않는다). 드로어 브레이크포인트 초과에서는 숨겨진다.
 * menu    — 프로필 드롭다운 안 인라인 노출용. inline과 달리 드로어 미디어 숨김도, 보더 박스도 없이
 *           radiogroup만 그대로 편다(호출부 컨테이너가 여백/스크롤을 소유). 로그인 사용자용 진입점.
 */
export type ThemePresetSwitcherVariant = 'popover' | 'inline' | 'menu';

export type ThemePresetSwitcherProps = {
  variant?: ThemePresetSwitcherVariant;
};
