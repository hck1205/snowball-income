import type { SVGProps } from 'react';
// per-icon named import → 번들러가 사용한 아이콘만 포함한다(트리셰이킹). 전체 세트를 끌어오지 않는다.
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Bold,
  CheckCircle2,
  ChevronDown,
  Clock,
  Code,
  Eye,
  Flame,
  Heading,
  Heart,
  Italic,
  LayoutGrid,
  LayoutList,
  Link,
  List,
  ListOrdered,
  MessageCircle,
  Minus,
  Redo2,
  Search,
  SlidersHorizontal,
  SquareCode,
  SquarePen,
  Strikethrough,
  Table,
  TextQuote,
  Trash2,
  Underline,
  Undo2,
  UserRound,
  Users,
  X
} from 'lucide-react';

/**
 * 커뮤니티 전용 아이콘 세트. 전부 lucide-react 래퍼로 통일했다 — 한 화면에서 형태/두께가 균일하게 보이고
 * 번들에는 실제로 쓴 아이콘만 들어간다(named import 트리셰이킹).
 *
 * `currentColor`로 그려 라이트/다크 어디서든 부모 색을 따른다. 장식용이므로 기본 `aria-hidden` +
 * `focusable=false`. 의미가 필요한 곳은 옆에 텍스트 라벨(숨김 포함)을 둔다.
 * stroke 두께는 1.8로 맞춰(LinkedIn식 절제된 라인) 지표/에디터/네비 아이콘이 한 톤으로 읽히게 한다.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const LUCIDE_STROKE = 1.8;

export const UsersIcon = ({ size = 18, ...rest }: IconProps) => (
  <Users size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

export const SearchIcon = ({ size = 18, ...rest }: IconProps) => (
  <Search size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

/** 정밀 검색 트리거 — lucide `SlidersHorizontal`. 활성 상태·개수는 배지 숫자+aria가 전달한다. */
export const FilterIcon = ({ size = 18, ...rest }: IconProps) => (
  <SlidersHorizontal size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

/** 검증 오류 표시(정밀 검색 range 등) — lucide `AlertCircle`. 색만으로 말하지 않게 텍스트+role="alert" 옆에 병기. */
export const AlertIcon = ({ size = 18, ...rest }: IconProps) => (
  <AlertCircle size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

/** 좋아요 하트 — lucide `Heart`. 안 눌림=외곽선(fill:none), 눌림=채움(fill:currentColor).
 *  색은 부모(LikeRoot)의 currentColor를 따른다(좋아요 시 semantic danger). */
export const HeartIcon = ({ size = 18, filled = false, ...rest }: IconProps & { filled?: boolean }) => (
  <Heart
    size={size}
    strokeWidth={LUCIDE_STROKE}
    fill={filled ? 'currentColor' : 'none'}
    aria-hidden
    focusable={false}
    {...rest}
  />
);

/** 댓글 수 — lucide `MessageCircle`. */
export const CommentIcon = ({ size = 18, ...rest }: IconProps) => (
  <MessageCircle size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

/** 조회 수 — lucide `Eye`. */
export const EyeIcon = ({ size = 18, ...rest }: IconProps) => (
  <Eye size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

export const GridIcon = ({ size = 18, ...rest }: IconProps) => (
  <LayoutGrid size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

export const ListIcon = ({ size = 18, ...rest }: IconProps) => (
  <LayoutList size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

/** 정렬: 최신(시간순). */
export const ClockIcon = ({ size = 18, ...rest }: IconProps) => (
  <Clock size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

/** 정렬: 인기(핫). */
export const FlameIcon = ({ size = 18, ...rest }: IconProps) => (
  <Flame size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

/** "시뮬 결과" 배지 등 — lucide `BarChart3`(막대 차트). */
export const ChartIcon = ({ size = 18, ...rest }: IconProps) => (
  <BarChart3 size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

export const BackIcon = ({ size = 18, ...rest }: IconProps) => (
  <ArrowLeft size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

export const PencilIcon = ({ size = 18, ...rest }: IconProps) => (
  <SquarePen size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

export const TrashIcon = ({ size = 18, ...rest }: IconProps) => (
  <Trash2 size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

export const CloseIcon = ({ size = 18, ...rest }: IconProps) => (
  <X size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

/** 프로필 설정 진입(AuthControl 메뉴) — lucide `UserRound`. */
export const UserRoundIcon = ({ size = 18, ...rest }: IconProps) => (
  <UserRound size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

/** 저장 성공 피드백 — lucide `CheckCircle2`. 색만으로 말하지 않기 위해 문장 옆에 병기한다. */
export const CheckCircleIcon = ({ size = 18, ...rest }: IconProps) => (
  <CheckCircle2 size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

/** 아코디언 디스클로저 표시(순수 장식) — lucide `ChevronDown`. 열림/닫힘 방향은 `aria-expanded`가 전달한다. */
export const ChevronDownIcon = ({ size = 18, ...rest }: IconProps) => (
  <ChevronDown size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

/* 리치텍스트 에디터 툴바 아이콘 — 전부 lucide로 통일한다. */

export const BoldIcon = ({ size = 18, ...rest }: IconProps) => (
  <Bold size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

export const ItalicIcon = ({ size = 18, ...rest }: IconProps) => (
  <Italic size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

export const LinkIcon = ({ size = 18, ...rest }: IconProps) => (
  <Link size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

export const BulletListIcon = ({ size = 18, ...rest }: IconProps) => (
  <List size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

export const OrderedListIcon = ({ size = 18, ...rest }: IconProps) => (
  <ListOrdered size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

export const HeadingIcon = ({ size = 18, ...rest }: IconProps) => (
  <Heading size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

export const UnderlineIcon = ({ size = 18, ...rest }: IconProps) => (
  <Underline size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

export const StrikethroughIcon = ({ size = 18, ...rest }: IconProps) => (
  <Strikethrough size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

/** 인라인 코드(`code`) — 꺾쇠 글리프. 코드 블록은 아래 CodeBlockIcon으로 구분한다. */
export const InlineCodeIcon = ({ size = 18, ...rest }: IconProps) => (
  <Code size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

export const CodeBlockIcon = ({ size = 18, ...rest }: IconProps) => (
  <SquareCode size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

export const QuoteIcon = ({ size = 18, ...rest }: IconProps) => (
  <TextQuote size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

export const HorizontalRuleIcon = ({ size = 18, ...rest }: IconProps) => (
  <Minus size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

/** 표 삽입 — lucide `Table`. 삽입 버튼만 아이콘이고, 표 조작 5개는 텍스트 라벨을 쓴다. */
export const TableIcon = ({ size = 18, ...rest }: IconProps) => (
  <Table size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

export const UndoIcon = ({ size = 18, ...rest }: IconProps) => (
  <Undo2 size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);

export const RedoIcon = ({ size = 18, ...rest }: IconProps) => (
  <Redo2 size={size} strokeWidth={LUCIDE_STROKE} aria-hidden focusable={false} {...rest} />
);
