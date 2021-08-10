import React, { FC } from 'react';
import { createUseStyles } from 'react-jss';
import cn from 'classnames';
import { isMacOs, mediaQuerySmallOnly } from '../../utils';

const useStyles = createUseStyles({
    columns: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        padding: '0 16px',
        [mediaQuerySmallOnly]: {
            gridTemplateColumns: '1fr'
        }
    },
    column: {
        display: 'flex',
        alignItems: 'start',
        justifyContent: 'center',
        flexDirection: 'column'
    },
    hotkeys: {
        alignItems: 'center'
    },
    noItemsLine: {
        width: '100%',
        textAlign: 'center',
        padding: '8px 0'
    },
    line: {
        margin: '0.5em 0'
    }
});

const url =
    'https://chrome.google.com/webstore/detail/net-logs/cjdmhjppaehhblekcplokfdhikmalnaf';
export const Empty: FC = () => {
    const styles = useStyles();
    const modifierKey = isMacOs() ? '⌘' : 'Ctrl';
    return (
        <section>
            <p className={cn(styles.line, styles.noItemsLine)}>
                ¯\_(ツ)_/¯ No items ¯\_(ツ)_/¯
            </p>
            <div className={styles.columns}>
                <div className={cn(styles.column, styles.hotkeys)}>
                    <p>
                        Focus search: <kbd>{modifierKey}</kbd>+<kbd>F</kbd>
                    </p>
                    <p>
                        Clear log: <kbd>{modifierKey}</kbd>+<kbd>L</kbd>
                    </p>
                    <p>
                        Toggle show/hide unrelated: <kbd>{modifierKey}</kbd>+
                        <kbd>Shift</kbd>+<kbd>U</kbd>
                    </p>
                    <p>
                        Toggle preserve log: <kbd>{modifierKey}</kbd>+
                        <kbd>P</kbd>
                    </p>
                </div>
                <div className={styles.column}>
                    <p className={styles.line}>
                        ⛰️{' '}
                        <a
                            href='https://nextjs.org/'
                            target='_blank'
                            rel='noreferrer'>
                            Next
                        </a>
                        /
                        <a
                            href='https://nuxtjs.org/'
                            target='_blank'
                            rel='noreferrer'>
                            Nuxt
                        </a>{' '}
                        state will appear here as row if available
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
            </div>
        </section>
    );
};
