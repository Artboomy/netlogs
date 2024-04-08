import React, { FC, useEffect } from 'react';
import { useSettings } from 'hooks/useSettings';
import { HiddenTagList } from './options/HiddenTagList';
import { Link } from './Link';
import { i18n } from 'translations/i18n';
import { Global } from '@emotion/react';
import styled from '@emotion/styled';

const Block = styled.section`
    padding: 0 8px;
`;

const TitleRow = styled.section(({ theme }) => ({
    padding: '0 8px',
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    backgroundColor: theme.panelColor,
    borderBottom: `1px solid ${theme.borderColor}`
}));

const CheckboxRow = styled.div`
    padding: 4px 0;
`;

const globalStyles = {
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
    }
};

export const Options: FC = () => {
    const [settings, setSettings] = useSettings();

    useEffect(() => {
        i18n.locale = settings.language;
    }, [settings.language]);

    return (
        <div>
            <Global styles={globalStyles} />
            <TitleRow>
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
            </TitleRow>

            <Block>
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
            </Block>

            <Block>
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
            </Block>
            <Block>
                <h2>{i18n.t('integrations')}</h2>
                <CheckboxRow>
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
                </CheckboxRow>
                <CheckboxRow>
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
                </CheckboxRow>
                <CheckboxRow>
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
                </CheckboxRow>
                <CheckboxRow>
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
                </CheckboxRow>
                <CheckboxRow>
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
                </CheckboxRow>
                <CheckboxRow>
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
                </CheckboxRow>
            </Block>
            <Block>
                <h2>{i18n.t('hiddenTags')}</h2>
                <HiddenTagList />
            </Block>
        </div>
    );
};
