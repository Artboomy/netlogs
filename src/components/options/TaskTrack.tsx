import React, { ChangeEvent, FC } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { ISettings } from '../../controllers/settings/types';

export const TaskTrack: FC<{ className?: string }> = ({ className }) => {
    const [settings, setSettings] = useSettings();
    const handleTaskTrackerChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setSettings({
            ...settings,
            taskTrackerName: e.target.value as ISettings['taskTrackerName']
        });
    };
    return (
        <section className={className}>
            <h2>Task tracker</h2>
            <select
                name='taskTracker'
                id='#taskTracker'
                value={settings.taskTrackerName}
                onChange={handleTaskTrackerChange}>
                <option value='null'>None</option>
                <option value='jira'>JIRA</option>
            </select>
        </section>
    );
};
