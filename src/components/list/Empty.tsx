import React, { FC } from 'react';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
    emptyContent: {
        display: 'flex',
        alignItems: 'center',
        height: '50vh',
        justifyContent: 'center',
        flexDirection: 'column'
    }
});

export const Empty: FC = () => {
    const styles = useStyles();
    return (
        <section className={styles.emptyContent}>
            <p>No items.</p>
            <p>You can drop HAR file here</p>
        </section>
    );
};
