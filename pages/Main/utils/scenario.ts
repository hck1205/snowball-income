type ScenarioLike = { id: string };
type NamedScenarioLike = ScenarioLike & { name: string };

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

export type ScenarioRename<TTab extends NamedScenarioLike> = {
  tabs: TTab[];
  /** 공유탭(sharedScenarioId)을 rename한 경우에만 채워지는 새 id. 일반 탭 rename이면 null. */
  promotedScenarioId: string | null;
};

/**
 * Renames a tab. If the renamed tab is the shared-link tab (`sharedScenarioId`), it is
 * "promoted" to a freshly generated id (retried until it doesn't collide with an existing tab)
 * so it stops behaving like the shared-tab special case. Unknown `scenarioId` is a no-op map
 * (returned tabs are unchanged, `promotedScenarioId` stays null) — this mirrors the caller's
 * existing behaviour and is intentionally not validated here.
 */
export const renameScenarioTabs = <TTab extends NamedScenarioLike>({
  tabs,
  scenarioId,
  nextName,
  sharedScenarioId,
  generateId
}: {
  tabs: TTab[];
  scenarioId: string;
  nextName: string;
  sharedScenarioId: string;
  generateId: () => string;
}): ScenarioRename<TTab> => {
  let promotedScenarioId: string | null = null;

  const nextTabs = tabs.map((tab) => {
    if (tab.id !== scenarioId) return tab;
    if (scenarioId !== sharedScenarioId) return { ...tab, name: nextName };

    let nextId = generateId();
    while (tabs.some((item) => item.id === nextId)) {
      nextId = generateId();
    }
    promotedScenarioId = nextId;
    return { ...tab, id: nextId, name: nextName };
  });

  return { tabs: nextTabs, promotedScenarioId };
};
