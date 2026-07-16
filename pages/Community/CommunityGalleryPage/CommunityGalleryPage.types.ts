import type { CommunityViewType } from '@/jotai/community';
import type { UseGalleryResult } from './hooks';

export type CommunityGalleryViewModel = UseGalleryResult & {
  viewType: CommunityViewType;
  onToggleView: (view: CommunityViewType) => void;
  onWrite: () => void;
};

export type CommunityGalleryViewProps = {
  viewModel: CommunityGalleryViewModel;
};
