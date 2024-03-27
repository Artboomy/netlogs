import React, { FC, ReactNode } from 'react';
import ContentOnlyItem from '../../models/ContentOnlyItem';
import { createUseStyles } from 'react-jss';
import { mediaQuerySmallOnly } from 'utils';
import cn from 'classnames';
import { Response } from '../Response';

interface IContentOnlyProp {
    className?: string;
    item: ContentOnlyItem;
    date: ReactNode;
    tag: ReactNode;
}

const useStyles = createUseStyles(() => {
    const minHeight = '20px';
    return {
        contentOnly: {
            display: 'flex',
            alignItems: 'baseline',
            gridColumn: '2/5',
            padding: '4px 8px',
            [mediaQuerySmallOnly]: {
                gridColumn: '1/3',
                flexDirection: 'column'
            }
        },
        content: {
            minHeight,
            [mediaQuerySmallOnly]: {
                paddingTop: '4px'
            }
        }
    };
});

export const ContentOnly: FC<IContentOnlyProp> = ({
    className,
    item,
    date,
    tag
}) => {
    const styles = useStyles();
    return (
        <>
            {date}
            <div className={cn(styles.contentOnly, className)}>
                {tag}
                <Response className={styles.content} item={item} />
            </div>
        </>
    );
};
ContentOnly.displayName = 'ContentOnlyRow';
