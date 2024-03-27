import React, { FC, ReactNode } from 'react';
import { createUseStyles } from 'react-jss';
import cn from 'classnames';
import { Theme } from 'theme/types';

export type TItem = {
    name: string;
    value: ReactNode;
};
export type TSection = {
    title: string;
    items: TItem[];
};
const useStyles = createUseStyles<Theme>((theme) => ({
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
    },
    valueNumber: {
        color: theme.valueNumber
    },
    valueString: {
        color: theme.valueString
    }
}));

const isQuoted = (s: unknown) =>
    typeof s === 'string' && s.startsWith('"') && s.endsWith('"');
export const Section: FC<TSection> = ({ title, items }) => {
    const styles = useStyles();
    return (
        <details className={styles.root} open>
            <summary>
                <strong>{title}</strong>
            </summary>
            {items.map(({ name, value }, index) => (
                <div key={`${name}${index}`} className={styles.item}>
                    <span className={styles.key}>{name}</span>:{' '}
                    <span
                        className={cn({
                            [styles.valueString]: isQuoted(value),
                            [styles.valueNumber]:
                                typeof value === 'number' ||
                                !isNaN(Number(value))
                        })}>
                        {value}
                    </span>
                </div>
            ))}
        </details>
    );
};
