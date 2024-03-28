import React, { FC } from 'react';
import { Disclaimer } from './Disclaimer';
import { createUseStyles } from 'react-jss';
import { Link } from '../Link';
import { i18n } from 'translations/i18n';

const useStyles = createUseStyles({
    howToList: {
        lineHeight: '1.5'
    },
    functionName: {
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '0 8px',
        margin: '0 4px',
        backgroundColor: '#eeeeee80'
    }
});

export const Instructions: FC = () => {
    const styles = useStyles();
    return (
        <section>
            <h3>How it works</h3>
            <ol className={styles.howToList}>
                <li>
                    <a href='#matcher'>
                        <code className={styles.functionName}>Matcher</code>
                    </a>{' '}
                    {i18n.t('matcherHelp')}
                </li>
                <li>{i18n.t('returnedProfileName')}</li>
                <li>
                    <a href='#shouldShow'>
                        <code className={styles.functionName}>shouldShow</code>
                    </a>{' '}
                    {i18n.t('shouldShowHelp')}
                </li>
                <li>
                    <a href='#getName'>
                        <code className={styles.functionName}>getName</code>
                    </a>{' '}
                    {i18n.t('getNameHelp')}
                </li>
                <li>
                    <a href='#getTag'>
                        <code className={styles.functionName}>getTag</code>
                    </a>{' '}
                    {i18n.t('getTagHelp')}
                </li>
                <li>
                    {i18n.t('isErrorHelp')}{' '}
                    <a href='#isError'>
                        <code className={styles.functionName}>isError</code>
                    </a>
                </li>
                <li>
                    <a href='#getParams'>
                        <code className={styles.functionName}>getParams</code>
                    </a>{' '}
                    {i18n.t('getParamsHelp')}
                </li>
                <li>
                    <a href='#getResult'>
                        <code className={styles.functionName}>getResult</code>
                    </a>{' '}
                    {i18n.t('getResultHelp')}
                </li>
                <li>
                    <a href='#getMeta'>
                        <code className={styles.functionName}>getMeta</code>
                    </a>{' '}
                    {i18n.t('getMetaHelp')}
                </li>
            </ol>
            <p>
                <code className={styles.functionName}>request</code>
                {i18n.t('harHelp')}{' '}
                <Link
                    text={i18n.t('harItem')}
                    href='http://www.softwareishard.com/blog/har-12-spec/#entries'
                />
            </p>
            <Disclaimer />
        </section>
    );
};
