import React, { useEffect, useState } from 'react';
import { IContentItem } from 'models/types';
import { InspectorWrapper } from './InspectorWrapper';

export const Response: React.FC<{
    item: IContentItem<unknown>;
    className?: string;
}> = ({ item, className }) => {
    const [data, setData] = useState<unknown | null>(null);
    useEffect(() => {
        if (!data) {
            item.getContent().then((result) => {
                setData(result);
            });
        }
    });
    return (
        <div className={className}>
            {!data ? (
                <InspectorWrapper data={{ data: 'Loading...' }} />
            ) : typeof data === 'string' ? (
                <div>{data}</div>
            ) : (
                <InspectorWrapper data={data} />
            )}
        </div>
    );
};
