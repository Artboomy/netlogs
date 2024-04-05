import React, { FC, useEffect } from 'react';
import { createUseStyles } from 'react-jss';
import { useSettings } from 'hooks/useSettings';
import cn from 'classnames';
import { HiddenTagList } from './options/HiddenTagList';
import { Link } from './Link';
import { Theme } from 'theme/types';
import { i18n } from 'translations/i18n';

const useStyles = createUseStyles<Theme>((theme) => ({
    '@global': {
        html: {
            height: '100%',
            minWidth: '1024px'
        },
        body: {
            height: '100%',
            margin: 0,
            fontSize: '100%'
        },
        '#root': {
            height: '100%'
        },
        ':target': {
            backgroundColor: '#ffa'
        }
    },
    root: {
        height: '100%',
        display: 'flex',
        gap: '8px'
    },
    section: {
        display: 'flex',
        gap: '4px',
        marginBottom: '4px'
    },
    block: {
        padding: '0 8px'
    },
    titleRow: {
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        backgroundColor: theme.panelColor,
        borderBottom: `1px solid ${theme.borderColor}`
    },
    checkboxRow: {
        padding: '4px 0'
    }
}));

export const Options: FC = () => {
    const [settings, setSettings] = useSettings();

    useEffect(() => {
        i18n.locale = settings.language;
    }, [settings.language]);

    const styles = useStyles();
    return (
        <div>
            <section className={cn(styles.titleRow, styles.block)}>
                <h1>{i18n.t('optionsTitle')}</h1>
                <div>
                    {i18n.t('links')}:{' '}
                    <Link
                        href='https://github.com/Artboomy/netlogs'
                        text='Github'
                    />{' '}
                    <Link
                        href='https://chrome.google.com/webstore/detail/net-logs/cjdmhjppaehhblekcplokfdhikmalnaf'
                        text={i18n.t('chromeStore')}
                    />{' '}
                </div>
            </section>

            <section className={styles.block}>
                <h2>{i18n.t('language')}</h2>
                <select
                    id='language'
                    onChange={(e) => {
                        setSettings({
                            ...settings,
                            language: e.target.value
                        });
                    }}
                    value={settings.language}>
                    <option value='en-US'>English</option>
                    <option value='de-DE'>Deutsch</option>
                    <option value='ru-RU'>Русский</option>
                    <option value='es-ES'>Español</option>
                    <option value='hi'>हिंदी</option>
                    <option value='zh-CN'>中文</option>
                    <option value='ja-JP'>日本語</option>
                </select>
            </section>

            <section className={styles.block}>
                <h2>{i18n.t('theme')}</h2>
                <select
                    id='themeColor'
                    onChange={(e) => {
                        setSettings({
                            ...settings,
                            theme: e.target.value as 'light' | 'dark'
                        });
                    }}
                    value={settings.theme}>
                    <option value='light'>{i18n.t('light')}</option>
                    <option value='dark'>{i18n.t('dark')}</option>
                </select>
            </section>
            <section className={styles.block}>
                <h2>{i18n.t('integrations')}</h2>
                <div className={styles.checkboxRow}>
                    <label>
                        <input
                            type='checkbox'
                            name='nextjsIntegration'
                            checked={settings.nextjsIntegration}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    nextjsIntegration: e.target.checked
                                })
                            }
                        />
                        Next.js {i18n.t('integration')}{' '}
                        <span
                            title={i18n.t('extractsNext', {
                                name: 'window.__NEXT_DATA__'
                            })}>
                            ❓
                        </span>
                    </label>
                </div>
                <div className={styles.checkboxRow}>
                    <label>
                        <input
                            type='checkbox'
                            name='jsonRpcIntegration'
                            checked={settings.jsonRpcIntegration}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    jsonRpcIntegration: e.target.checked
                                })
                            }
                        />
                        {i18n.t('Unwrap')}{' '}
                        <Link
                            text='JSON-RPC'
                            href='https://www.jsonrpc.org/specification'
                        />{' '}
                        {i18n.t('requests')}
                    </label>
                </div>
                <div className={styles.checkboxRow}>
                    <label>
                        <input
                            type='checkbox'
                            name='sendAnalytics'
                            checked={settings.sendAnalytics}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    sendAnalytics: e.target.checked
                                })
                            }
                        />
                        {i18n.t('sendAnalytics')}
                    </label>
                </div>
                <div className={styles.checkboxRow}>
                    <label>
                        <input
                            type='checkbox'
                            name='debuggerEnabled'
                            checked={settings.debuggerEnabled}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    debuggerEnabled: e.target.checked
                                })
                            }
                        />
                        {i18n.t('autoattachDebugger')}
                    </label>
                </div>
                <div className={styles.checkboxRow}>
                    <label>
                        <input
                            type='checkbox'
                            name='graphqlIntegration'
                            checked={settings.graphqlIntegration}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    graphqlIntegration: e.target.checked
                                })
                            }
                        />
                        {i18n.t('Unwrap')}{' '}
                        <Link text='GraphQL' href='https://graphql.org/' />{' '}
                        {i18n.t('requests')}
                    </label>
                </div>
                <div className={styles.checkboxRow}>
                    <label>
                        <input
                            type='checkbox'
                            name='nuxtjsIntegraction'
                            checked={settings.nuxtjsIntegraction}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    nuxtjsIntegraction: e.target.checked
                                })
                            }
                        />
                        NuxtJS {i18n.t('integration')}{' '}
                        <span
                            title={i18n.t('extractsNext', {
                                name: 'window.__NUXT__'
                            })}>
                            ❓
                        </span>
                    </label>
                </div>
            </section>
            <section className={styles.block}>
                <h2>{i18n.t('hiddenTags')}</h2>
                <HiddenTagList />
            </section>
        </div>
    );
};
