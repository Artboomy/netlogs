import React, { FC } from 'react';
import { createUseStyles } from 'react-jss';
import { Section, TSection } from './Section';
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
    return (
        <section className={styles.root}>
            {Object.entries(data).map(([key, sectionData]) => (
                <Section key={key} {...sectionData} />
            ))}
        </section>
    );
};
