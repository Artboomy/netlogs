import { ISettings, ISettingsSerialized } from 'controllers/settings/types';
import instance, { SettingsListener } from '../controllers/settings';
import { create } from 'zustand';

export const useSettings = create<{
    __listener: SettingsListener;
    init: () => void;
    deinit: () => void;
    settings: ISettings;
    patchSettings: (
        newSettingsPartial: Partial<ISettings | ISettingsSerialized>
    ) => void;
    setSettings: (newSettings: ISettings | ISettingsSerialized) => void;
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
        return instance.set({ ...get().settings, ...newSettingsPartial } as
            | ISettings
            | ISettingsSerialized);
    },
    setSettings: (newSettings: ISettings | ISettingsSerialized) =>
        instance.set(newSettings),
    resetSettings: () =>
        instance.reset().then(() => set({ settings: instance.get() }))
}));
