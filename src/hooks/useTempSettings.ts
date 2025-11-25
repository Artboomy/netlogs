import { create } from 'zustand';

export const useTempSettings = create<{
    isVerticalView: boolean;
}>(() => ({
    isVerticalView: false
}));
