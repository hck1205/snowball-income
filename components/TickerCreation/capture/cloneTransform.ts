import { CAPTURE_PADDING_Y, HIDE_SELECTORS } from './constants';
import type { CaptureContext } from './types';

const makeCenterWrappers = (doc: Document): { outer: HTMLDivElement; inner: HTMLDivElement } => {
  const outer = doc.createElement('div');
  outer.style.width = '100%';
  outer.style.maxWidth = 'none';
  outer.style.boxSizing = 'border-box';
  outer.style.display = 'flex';
  outer.style.justifyContent = 'center';
  outer.style.alignItems = 'flex-start';
  outer.style.overflow = 'visible';

  const inner = doc.createElement('div');
  inner.style.width = '100%';
  inner.style.maxWidth = 'none';
  inner.style.boxSizing = 'border-box';
  inner.style.paddingTop = `${CAPTURE_PADDING_Y}px`;
  inner.style.display = 'flex';
  inner.style.justifyContent = 'center';
  inner.style.alignItems = 'flex-start';
  inner.style.overflow = 'visible';

  outer.appendChild(inner);
  return { outer, inner };
};

const normalizeCloneDocument = (doc: Document, captureWidth: number) => {
  doc.documentElement.style.width = `${captureWidth}px`;
  doc.documentElement.style.height = 'auto';
  doc.documentElement.style.maxHeight = 'none';
  doc.documentElement.style.overflow = 'visible';
  doc.body.style.width = `${captureWidth}px`;
  doc.body.style.height = 'auto';
  doc.body.style.maxHeight = 'none';
  doc.body.style.maxWidth = 'none';
  doc.body.style.margin = '0';
  doc.body.style.overflow = 'visible';
};

const normalizeCloneRoot = (root: HTMLElement, layoutWidth: number) => {
  root.style.position = 'relative';
  root.style.width = `${layoutWidth}px`;
  root.style.height = 'auto';
  root.style.maxHeight = 'none';
  root.style.maxWidth = 'none';
  root.style.margin = '0 auto';
  root.style.left = 'auto';
  root.style.top = 'auto';
  root.style.background = '#ffffff';
  root.style.overflow = 'visible';
};

const hideUiOnlyElements = (doc: Document, root: HTMLElement) => {
  root.querySelectorAll<HTMLElement>(HIDE_SELECTORS).forEach((element) => {
    element.style.display = 'none';
  });
  doc.querySelectorAll<HTMLElement>(HIDE_SELECTORS).forEach((element) => {
    element.style.display = 'none';
  });
};

const normalizeLayoutPanels = (root: HTMLElement) => {
  const contentLayout = root.querySelector<HTMLElement>('[data-capture-role="content-layout"]');
  if (contentLayout) {
    contentLayout.style.display = 'grid';
    contentLayout.style.gridTemplateColumns = 'minmax(250px, 320px) minmax(0, 1fr)';
    contentLayout.style.gap = '20px';
  }

  const drawerPanel = root.querySelector<HTMLElement>('[data-capture-role="drawer-panel"]');
  if (drawerPanel) {
    drawerPanel.style.display = 'grid';
    drawerPanel.style.position = 'static';
    drawerPanel.style.transform = 'none';
    drawerPanel.style.width = 'auto';
    drawerPanel.style.height = 'auto';
    drawerPanel.style.maxHeight = 'none';
    drawerPanel.style.overflow = 'visible';
    drawerPanel.style.padding = '0';
  }
};

const expandClippedElements = (root: HTMLElement, view: Window | null) => {
  if (!view) return;
  root.querySelectorAll<HTMLElement>('*').forEach((element) => {
    const computed = view.getComputedStyle(element);
    const isClippedY = computed.overflowY !== 'visible' && computed.overflowY !== 'clip';
    const isClippedX = computed.overflowX !== 'visible' && computed.overflowX !== 'clip';
    if (isClippedY && element.scrollHeight > element.clientHeight) {
      element.style.overflowY = 'visible';
      element.style.maxHeight = 'none';
      element.style.height = 'auto';
    }
    if (isClippedX && element.scrollWidth > element.clientWidth) {
      element.style.overflowX = 'visible';
      element.style.maxWidth = 'none';
      element.style.width = 'auto';
    }
    if (computed.contain !== 'none') {
      element.style.contain = 'none';
    }
  });
};

const eagerLoadImages = (root: HTMLElement) => {
  root.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((img) => {
    img.loading = 'eager';
  });
};

export const buildCloneTransformer = (context: Pick<CaptureContext, 'captureWidth' | 'layoutWidth'>) => (clonedDoc: Document) => {
  const clonedRoot = (clonedDoc.getElementById('root') as HTMLElement | null) ?? (clonedDoc.body as HTMLElement | null);
  if (!clonedRoot) return;

  normalizeCloneDocument(clonedDoc, context.captureWidth);
  const { outer, inner } = makeCenterWrappers(clonedDoc);

  const parent = clonedRoot.parentElement;
  if (parent) {
    parent.insertBefore(outer, clonedRoot);
  } else {
    clonedDoc.body.appendChild(outer);
  }
  inner.appendChild(clonedRoot);

  normalizeCloneRoot(clonedRoot, context.layoutWidth);
  hideUiOnlyElements(clonedDoc, clonedRoot);
  normalizeLayoutPanels(clonedRoot);
  expandClippedElements(clonedRoot, clonedDoc.defaultView);
  eagerLoadImages(clonedRoot);
};

