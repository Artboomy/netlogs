import React, { FC, useEffect, useRef } from 'react';
import { createUseStyles } from 'react-jss';
import { Section, TSection } from './Section';
import { callParentVoid } from '../utils';

export type PropTreeProps = {
    data: {
        [key: string]: TSection;
    };
};
const useStyles = createUseStyles({
    root: {
        fontFamily: 'Tahoma, sans-serif',
        fontSize: '12px',
        lineHeight: 1.5
    }
});

export const PropTree: FC<PropTreeProps> = ({ data }) => {
    const styles = useStyles();
    const openedRef = useRef(Date.now());
    useEffect(() => {
        return () => {
            callParentVoid(
                'analytics.propTreeViewed',
                String(Date.now() - openedRef.current)
            );
        };
    }, []);
    return (
        <section className={styles.root}>
            {Object.entries(data).map(([key, sectionData]) => (
                <Section key={key} {...sectionData} />
            ))}
        </section>
    );
};
