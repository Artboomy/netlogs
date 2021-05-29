import React, { FC, ReactNode } from 'react';
import { createUseStyles } from 'react-jss';
import { theme } from '../theme/light';

type TItem = {
    name: string;
    value: ReactNode;
};
export type TSection = {
    title: string;
    items: TItem[];
};
const useStyles = createUseStyles({
    root: {
        borderBottom: '1px solid #eaeaea',
        marginBottom: '4px',
        paddingBottom: '4px'
    },
    item: {
        marginLeft: '16px'
    },
    key: {
        fontWeight: 'bold',
        color: theme.section.key
    }
});

export const Section: FC<TSection> = ({ title, items }) => {
    const styles = useStyles();
    return (
        <details className={styles.root} open>
            <summary>
                <strong>{title}</strong>
            </summary>
            {items.map(({ name, value }, index) => (
                <div key={`${name}${index}`} className={styles.item}>
                    <span className={styles.key}>{name}</span>: {value}
                </div>
            ))}
        </details>
    );
};
