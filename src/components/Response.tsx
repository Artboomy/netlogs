import React from 'react';
import { IContentItem } from 'models/types';
import { InspectorWrapper } from './InspectorWrapper';

export const Response: React.FC<{
    item: IContentItem<unknown>;
    className?: string;
}> = ({ item, className }) => {
    const data = item.getContent();
    return (
        <div className={className}>
            {typeof data === 'string' ? (
                <div>{data}</div>
            ) : (
                <InspectorWrapper data={item.getContent()} />
            )}
        </div>
    );
};
