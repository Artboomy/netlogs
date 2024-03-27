import React, { FC } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { Tag } from '../Tag';
import { ItemType } from '../../models/types';
import { i18n } from 'translations/i18n';

export const HiddenTagList: FC = () => {
    const [settings] = useSettings();
    const list = Object.values(settings.hiddenTags);
    if (!list.length) {
        return <div>{i18n.t('noHiddenTags')}</div>;
    }
    return (
        <div>
            {list.map((t) => (
                <Tag key={t} content={t} type={ItemType.ContentOnly} />
            ))}
        </div>
    );
};
