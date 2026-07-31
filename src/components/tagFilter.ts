export interface TagVisibilityState {
    hiddenTags: Record<string, string>;
    selectedTag: string | null;
}

export const isTagVisible = (
    tag: string,
    { hiddenTags, selectedTag }: TagVisibilityState
): boolean => (selectedTag ? selectedTag === tag : !hiddenTags[tag]);
