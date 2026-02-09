import React, { FC, useEffect } from 'react';
import { useSettings } from 'hooks/useSettings';
import { HiddenTagList } from './options/HiddenTagList';
import { JiraOptions } from './options/JiraOptions';
import { i18n } from 'translations/i18n';
import { Global } from '@emotion/react';
import styled from '@emotion/styled';
import Inspector from 'react-inspector';
import { Block } from 'components/options/Block';
import analytics from 'api/analytics';
import { LanguageSelect } from 'components/LanguageSelect';

const TitleRow = styled.section({
    padding: '0 8px 8px 24px',
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    backgroundColor: 'rgb(243, 243, 243)',
    borderBottom: `1px solid #dadce0`
});

const CheckboxRow = styled.div`
    padding: 4px 0;
`;

const Link = styled.a`
    margin-right: 4px;
`;

const globalStyles = {
    html: {
        height: '100%',
        minWidth: '1024px'
    },
    body: {
        height: '100%',
        margin: 0,
        fontSize: '16px !important'
    },
    h2: {
        margin: '8px 0'
    },
    '#root': {
        height: '100%'
    },
    ':target': {
        backgroundColor: '#ffa'
    }
};

export const Options: FC = () => {
    const { settings, setSettings } = useSettings();

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
                        target={'_blank'}
                        rel={'noreferrer noopener'}>
                        Github
                    </Link>
                    <Link
                        href='https://chrome.google.com/webstore/detail/net-logs/cjdmhjppaehhblekcplokfdhikmalnaf'
                        target={'_blank'}>
                        {i18n.t('chromeStore')}
                    </Link>
                </div>
            </TitleRow>
            <Block>
                <button onClick={() => useSettings.getState().resetSettings()}>
                    {i18n.t('reset')}
                </button>
            </Block>
            <Block>
                <h2>{i18n.t('language')}</h2>
                <LanguageSelect />
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
                            href='https://www.jsonrpc.org/specification'
                            target={'_blank'}
                            rel={'noreferrer noopener'}>
                            JSON-RPC
                        </Link>
                        {i18n.t('requests')}
                    </label>
                </CheckboxRow>
                <CheckboxRow>
                    <label>
                        <input
                            type='checkbox'
                            name='sendAnalytics'
                            checked={settings.sendAnalytics}
                            onChange={(e) => {
                                setSettings({
                                    ...settings,
                                    sendAnalytics: e.target.checked
                                });
                                if (e.target.checked) {
                                    analytics.fireEvent('analyticsEnabled');
                                } else {
                                    analytics.fireEvent('analyticsDisabled');
                                }
                            }}
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
                        <Link
                            href='https://graphql.org/'
                            target={'_blank'}
                            rel={'noreferrer noopener'}>
                            GraphQL
                        </Link>
                        {i18n.t('requests')}
                    </label>
                </CheckboxRow>
                <CheckboxRow>
                    <label>
                        <input
                            type='checkbox'
                            name='nuxtjsIntegraction'
                            checked={settings.nuxtjsIntegration}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    nuxtjsIntegration: e.target.checked
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
            <JiraOptions />
            <Block>
                <h2>DEV ZONE</h2>
                <Inspector
                    name={'methodChecks'}
                    data={settings.methodChecks}
                    onMouseDown={() => null}
                />
            </Block>
        </div>
    );
};
