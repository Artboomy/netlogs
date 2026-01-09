import { ISettings } from 'controllers/settings/types';
import instance, { SettingsListener } from '../controllers/settings';
import { create } from 'zustand';

export const useSettings = create<{
    __listener: SettingsListener;
    init: () => void;
    deinit: () => void;
    settings: ISettings;
    patchSettings: (
        newSettingsPartial: Partial<ISettings>
    ) => void;
    setSettings: (newSettings: ISettings) => void;
    resetSettings: () => void;
}>((set, get) => ({
    __listener: (newSettings) => set({ settings: newSettings }),
    init: () => {
        instance.addListener(get().__listener);
    },
    deinit: () => {
        instance.removeListener(get().__listener);
    },
    settings: instance.get(),
    patchSettings: (newSettingsPartial) => {
        return instance.set({ ...get().settings, ...newSettingsPartial });
    },
    setSettings: (newSettings: ISettings) =>
        instance.set(newSettings),
    resetSettings: () =>
        instance.reset().then(() => set({ settings: instance.get() }))
}));
