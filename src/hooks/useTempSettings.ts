import { create } from 'zustand';

export interface TempSettingsState {
    isVerticalView: boolean;
    selectedTag: string | null;
}

export const useTempSettings = create<TempSettingsState>(() => ({
    isVerticalView: false,
    selectedTag: null
}));
