/**
 * 커뮤니티 도메인 컴포넌트 배럴 — **가벼운 컴포넌트만** 재export 한다.
 *
 * ⚠ Tiptap 에디터(`RichTextEditor`)와 dompurify 렌더러(`RichTextContent`)는 **여기 넣지 않는다.**
 *   여기 넣으면 이 배럴을 import하는 목록/상세 청크에 Tiptap/dompurify가 딸려온다.
 *   두 컴포넌트는 필요한 페이지(글쓰기/상세)에서 폴더 경로로 직접 import 한다:
 *     import { RichTextEditor } from '@/components/community/RichTextEditor';
 *     import { RichTextContent } from '@/components/community/RichTextContent';
 */
export * from './CommunityIcons';
export { Avatar } from './Avatar';
export type { AvatarProps, AvatarSize } from './Avatar';
export { RelativeTime } from './RelativeTime';
export { ScenarioMeta, VisuallyHidden } from './ScenarioMeta';
export { SimBadge } from './SimBadge';
export { LikeButton } from './LikeButton';
export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';
export { ScenarioCard } from './ScenarioCard';
export { ScenarioRow } from './ScenarioRow';
export { CommunityModal } from './CommunityModal';
export { ConfirmDialog } from './ConfirmDialog';
export type { ConfirmDialogProps } from './ConfirmDialog';
export { LoginModal } from './LoginModal';
export { CommunityAuthProvider, useCommunityAuth } from './CommunityAuthProvider';
export { AuthControl } from './AuthControl';
export { CommunitySearchBar } from './CommunitySearchBar';
export { CommunityHeader } from './CommunityHeader';
