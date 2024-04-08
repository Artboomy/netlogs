import { ISettings, ISettingsSerialized } from 'controllers/settings/types';
import { useEffect, useState } from 'react';
import instance from '../controllers/settings';

export const useSettings = (): [
    settings: ISettings,
    setSettings: (newSettings: ISettings | ISettingsSerialized) => void,
    resetSettings: () => void
] => {
    const [settings, setSettings] = useState<ISettings>(instance.get());
    useEffect(() => {
        instance.addListener((newSettings) => {
            //pass
            setSettings(newSettings);
        });
    }, []);
    return [
        settings,
        (newSettings) => instance.set(newSettings),
        () => instance.reset().then(() => setSettings(instance.get()))
    ];
};
