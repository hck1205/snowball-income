type ScenarioLike = { id: string };

export type ScenarioRemoval<TTab extends ScenarioLike> = {
  tabs: TTab[];
  nextActiveTab: TTab;
};

/**
 * Moves `fromId` to the position of `toId`.
 * Returns null when the move is a no-op or either id is unknown.
 */
export const reorderTabs = <TTab extends ScenarioLike>(tabs: TTab[], fromId: string, toId: string): TTab[] | null => {
  if (fromId === toId) return null;

  const fromIndex = tabs.findIndex((tab) => tab.id === fromId);
  const toIndex = tabs.findIndex((tab) => tab.id === toId);
  if (fromIndex < 0 || toIndex < 0) return null;

  const reorderedTabs = [...tabs];
  const [movingTab] = reorderedTabs.splice(fromIndex, 1);
  if (!movingTab) return null;
  reorderedTabs.splice(toIndex, 0, movingTab);

  return reorderedTabs;
};

/**
 * Removes a tab and picks the tab that should become active.
 * Deleting the active tab falls back to its left neighbour; deleting another tab keeps the active one.
 * Returns null when the tab is unknown or nothing would be left to activate.
 */
export const removeScenarioTab = <TTab extends ScenarioLike>({
  tabs,
  deletingId,
  activeId
}: {
  tabs: TTab[];
  deletingId: string;
  activeId: string;
}): ScenarioRemoval<TTab> | null => {
  const deletingIndex = tabs.findIndex((tab) => tab.id === deletingId);
  if (deletingIndex < 0) return null;

  const remainingTabs = tabs.filter((tab) => tab.id !== deletingId);
  const nextActiveTab =
    deletingId === activeId
      ? remainingTabs[Math.max(0, deletingIndex - 1)] ?? remainingTabs[0]
      : tabs.find((tab) => tab.id === activeId) ?? remainingTabs[0];
  if (!nextActiveTab) return null;

  return { tabs: remainingTabs, nextActiveTab };
};
