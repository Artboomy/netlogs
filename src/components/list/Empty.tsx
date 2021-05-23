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
            <p>
                You can find readme{' '}
                <a
                    href='https://github.com/Artboomy/netlogs'
                    target='_blank'
                    rel='noreferrer'>
                    here
                </a>
            </p>
            <p>Drop HAR file to see what&apos;s inside</p>
        </section>
    );
};
