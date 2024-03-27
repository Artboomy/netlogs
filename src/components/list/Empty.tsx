import React, { FC } from 'react';
import { createUseStyles } from 'react-jss';
import cn from 'classnames';
import { isMacOs, mediaQuerySmallOnly } from 'utils';
import { Link } from '../Link';
import { Theme } from 'theme/types';
import { i18n } from '../../translations/i18n';

const useStyles = createUseStyles<Theme>((theme) => ({
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
        padding: '8px 0',
        display: 'block!important',
        fontSize: '1.4em'
    },
    line: {
        margin: '0.5em 0'
    },
    newBlock: {
        color: theme.mainBg,
        backgroundColor: 'orange',
        content: 'close-quote',
        padding: '2px 4px',
        borderRadius: '4px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontSize: '9px'
    }
}));

const url =
    'https://chrome.google.com/webstore/detail/net-logs/cjdmhjppaehhblekcplokfdhikmalnaf';
export const Empty: FC = () => {
    const styles = useStyles();
    const modifierKey = isMacOs() ? '⌘' : 'Ctrl';
    return (
        <section>
            <p className={cn(styles.line, styles.noItemsLine)}>
                👀 {i18n.t('noItems')} 👀
            </p>
            <div className={styles.columns}>
                <div className={cn(styles.column, styles.hotkeys)}>
                    <p>
                        {i18n.t('focusSearch')}: <kbd>{modifierKey}</kbd>+
                        <kbd>F</kbd>
                    </p>
                    <p>
                        {i18n.t('clearLog')}: <kbd>{modifierKey}</kbd>+
                        <kbd>L</kbd>
                    </p>
                    <p>
                        {i18n.t('toggleUnrelated')}: <kbd>{modifierKey}</kbd>+
                        <kbd>Shift</kbd>+<kbd>U</kbd>
                    </p>
                    <p>
                        {i18n.t('togglePreserve')}: <kbd>{modifierKey}</kbd>+
                        <kbd>P</kbd>
                    </p>
                </div>
                <div className={styles.column}>
                    <p className={styles.line}>
                        🌑 <span className={styles.newBlock}>New</span>
                        {i18n.t('themeHelper')}
                    </p>
                    <p className={styles.line}>
                        🔴 <span className={styles.newBlock}>New</span>{' '}
                        {i18n.t('webSocketHelper')}{' '}
                        <Link
                            href={
                                'https://developer.chrome.com/docs/extensions/reference/api/debugger'
                            }
                            text='CDP'
                        />
                        .
                    </p>
                    <p className={styles.line}>
                        ⛰️ <Link href='https://nextjs.org/' text='Next' />
                        /
                        <Link href='https://nuxt.com/' text='Nuxt' />{' '}
                        {i18n.t('nextHelper')}
                    </p>
                    <p className={styles.line}>👆 {i18n.t('timeHelper')}</p>
                    <p className={styles.line}>
                        📖 {i18n.t('readmeHelper')}{' '}
                        <Link
                            href='https://github.com/Artboomy/netlogs#readme'
                            text={i18n.t('here')}
                        />
                    </p>
                    <p className={styles.line}>
                        📦 {i18n.t('dropHelper', { name: 'HAR/netlogs.zip' })}
                    </p>
                    <p className={styles.line}>
                        ❤️ {i18n.t('shareHelper')} -{' '}
                        <Link href={url} text={i18n.t('share')} />{' '}
                        {i18n.t('shareHelper2')}
                    </p>
                </div>
            </div>
        </section>
    );
};
