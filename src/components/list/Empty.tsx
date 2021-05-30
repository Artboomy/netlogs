import React, { FC } from 'react';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
    root: {
        display: 'flex',
        justifyContent: 'center',
        height: '50vh'
    },
    emptyContent: {
        display: 'flex',
        alignItems: 'start',
        justifyContent: 'center',
        flexDirection: 'column'
    },
    line: {
        margin: '0.5em 0'
    }
});

const url =
    'https://chrome.google.com/webstore/detail/net-logs/cjdmhjppaehhblekcplokfdhikmalnaf';
export const Empty: FC = () => {
    const styles = useStyles();
    return (
        <section className={styles.root}>
            <div className={styles.emptyContent}>
                <p className={styles.line}>No items.</p>
                <p className={styles.line}>
                    ⛰️ Next/Nuxt state will appear here as row if available
                </p>
                <p className={styles.line}>
                    👆 Press on item date to show headers
                </p>
                <p className={styles.line}>
                    📖 You can find readme{' '}
                    <a
                        href='https://github.com/Artboomy/netlogs'
                        target='_blank'
                        rel='noreferrer'>
                        here
                    </a>
                </p>
                <p className={styles.line}>
                    📦 Drop HAR/netlogs.zip file to see what&apos;s inside
                </p>
                <p className={styles.line}>
                    ❤️ If you like the extension -{' '}
                    <a href={url} target='_blank' rel='noreferrer'>
                        share
                    </a>{' '}
                    with your friends and colleagues
                </p>
            </div>
        </section>
    );
};
