import React, {
    ChangeEvent,
    ChangeEventHandler,
    FC,
    useEffect,
    useState
} from 'react';
import { deserializeFunctionsRaw, serialize } from 'controllers/settings';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/mode/javascript/javascript';
import cloneDeep from 'lodash.clonedeep';
import isEqual from 'lodash.isequal';
import { createUseStyles } from 'react-jss';
import {
    IProfile,
    IProfileSerialized,
    ISettings,
    ISettingsSerialized
} from 'controllers/settings/types';
import downloadAsFile from '../utils';
import { CodeEditor } from './options/CodeEditor';
import { parseFile } from 'controllers/file';
import { Instructions } from './options/Instructions';
import { Demo } from './options/Demo';
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
    left: {
        width: '50%',
        paddingLeft: '8px',
        overflow: 'auto'
    },
    right: {
        width: '50%',
        overflow: 'auto'
    },
    header: {
        // sticky position results in content occlusion when clicking on relative links
        /*position: 'sticky',
        top: 0,
        zIndex: 100,*/
        backgroundColor: 'white'
    },
    codeBlock: {
        '& .CodeMirror': {
            height: 'auto'
        }
    },
    importButton: {
        border: '1px solid rgb(118, 118, 118)',
        height: '22px',
        fontSize: '13.333px',
        fontFamily: 'Arial',
        display: 'flex',
        alignItems: 'center',
        padding: '1px 6px',
        verticalAlign: 'middle',
        backgroundColor: 'rgb(239, 239, 239)',
        cursor: 'pointer'
    },
    section: {
        display: 'flex',
        gap: '4px',
        marginBottom: '4px'
    },
    defaultProfileNote: {
        margin: 0
    },
    block: {
        padding: '0 8px'
    },
    profilesBlock: {
        height: '100%'
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

const handleExport = (name: string, data: IProfile | IProfileSerialized) => {
    downloadAsFile(
        serialize(
            {
                name,
                data
            },
            '    '
        ),
        `${name}.json`
    );
};
const CURRENT_PROFILE_KEY = 'CURRENT_PROFILE_KEY';

function getInitialProfileName(profiles: ISettings['profiles']): string {
    const local = localStorage.getItem(CURRENT_PROFILE_KEY);
    return local && profiles.hasOwnProperty(local) ? local : 'default';
}

export const Options: FC = () => {
    const [settings, setSettings, resetSettings] = useSettings();
    const [currentProfile, setCurrentProfile] = useState(
        getInitialProfileName(settings.profiles)
    );

    useEffect(() => {
        i18n.locale = settings.language;
    }, [settings.language]);
    useEffect(() => {
        setFunctions(
            Object.assign(
                {},
                ...Object.entries(profile.functions).map(([key, value]) => ({
                    [key]: value.toString()
                }))
            )
        );
    }, [currentProfile]);
    const profile = settings.profiles[currentProfile];
    const [functions, setFunctions] = useState<IProfileSerialized['functions']>(
        Object.assign(
            {},
            ...Object.entries(profile.functions).map(([key, value]) => ({
                [key]: value.toString()
            }))
        )
    );

    const [matcher, setMatcher] = useState<ISettingsSerialized['matcher']>(
        settings.matcher.toString()
    );

    useEffect(() => {
        const newFunctions = Object.assign(
            {},
            ...Object.entries(profile.functions).map(([key, value]) => ({
                [key]: value.toString()
            }))
        );
        if (!isEqual(newFunctions, functions)) {
            setFunctions(newFunctions);
        }
    }, [settings]);

    const handleSave = () => {
        try {
            deserializeFunctionsRaw(functions);
            const clonedSettings = cloneDeep(settings);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            clonedSettings.profiles[currentProfile].functions = functions;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            clonedSettings.matcher = matcher;
            setSettings(clonedSettings);
        } catch (e) {
            alert(i18n.t('cannotSaveInvalid'));
        }
    };

    const handleReset = () => {
        if (window.confirm(i18n.t('wipeSettings'))) {
            localStorage.removeItem(CURRENT_PROFILE_KEY);
            setCurrentProfile('default');
            resetSettings();
        }
    };

    const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setCurrentProfile(e.target.value);
        localStorage.setItem(CURRENT_PROFILE_KEY, e.target.value);
    };

    const handleDeleteProfile = () => {
        delete settings.profiles[currentProfile];
        setCurrentProfile('default');
        localStorage.removeItem(CURRENT_PROFILE_KEY);
        setSettings(settings);
    };

    const handleNewProfile = () => {
        const name = window.prompt(i18n.t('profileNamePrompt'));
        if (name) {
            settings.profiles[name] = cloneDeep(settings.profiles.default);
            setSettings(settings);
            setCurrentProfile(name);
            localStorage.setItem(CURRENT_PROFILE_KEY, name);
        }
    };

    const handleImportProfile: ChangeEventHandler<HTMLInputElement> = (e) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }
        parseFile<{ name: string; data: IProfileSerialized }>(file).then(
            (newProfile) => {
                if (newProfile.name in settings.profiles) {
                    newProfile.name += '(Copy)';
                }
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                settings.profiles[newProfile.name] = newProfile.data;
                setSettings(settings);
                window.alert(
                    i18n.t('profileImported', { name: newProfile.name })
                );
            },
            (e) =>
                window.alert(i18n.t('invalidProfile', { message: e.message }))
        );
    };

    const isDefaultProfile = currentProfile === 'default';

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
            <section className={cn(styles.block, styles.profilesBlock)}>
                <h2>{i18n.t('profiles')}</h2>
                <section className={styles.root}>
                    <div className={styles.left}>
                        <div className={styles.header}>
                            <section className={styles.section}>
                                <button onClick={handleSave}>
                                    {i18n.t('save')}
                                </button>
                                <button onClick={handleReset}>
                                    {' '}
                                    {i18n.t('reset')}
                                </button>
                                <label
                                    htmlFor='file-selector'
                                    role='button'
                                    className={styles.importButton}>
                                    {i18n.t('importProfile')}
                                    <input
                                        type='file'
                                        id='file-selector'
                                        accept='.json'
                                        style={{ display: 'none' }}
                                        onChange={handleImportProfile}
                                    />
                                </label>

                                <button onClick={handleNewProfile}>
                                    {i18n.t('newProfile')}
                                </button>
                            </section>
                            <section className={styles.section}>
                                <select
                                    id='profile'
                                    onChange={handleChange}
                                    value={currentProfile}>
                                    {Object.keys(settings.profiles)
                                        .filter(
                                            (key) =>
                                                ![
                                                    'jsonRpc',
                                                    'graphql'
                                                ].includes(key)
                                        )
                                        .map((name) => (
                                            <option key={name} value={name}>
                                                {name}
                                            </option>
                                        ))}
                                </select>
                                <button
                                    onClick={() =>
                                        handleExport(currentProfile, profile)
                                    }>
                                    {i18n.t('exportProfile')}
                                </button>
                                {isDefaultProfile ? (
                                    <h4 className={styles.defaultProfileNote}>
                                        {i18n.t('defaultNotEditable')}
                                    </h4>
                                ) : (
                                    <button onClick={handleDeleteProfile}>
                                        {i18n.t('deleteProfile')}
                                    </button>
                                )}
                            </section>
                        </div>
                        <Instructions />
                        <section className={styles.codeBlock}>
                            <h3 id='matcher'>{i18n.t('profileMatcher')}</h3>
                            <i>{i18n.t('profileMatcherHelper')}</i>
                            <CodeEditor
                                onBeforeChange={(editor, data, value) => {
                                    setMatcher(value);
                                }}
                                value={matcher}
                            />
                        </section>
                        <Demo />
                    </div>
                    <div className={styles.right}>
                        {Object.entries(functions)
                            .sort(([a], [b]) => (a > b ? 1 : -1))
                            .map(([key, value]) => {
                                return (
                                    <section
                                        key={key}
                                        className={styles.codeBlock}>
                                        <h3 id={key}>
                                            {i18n.t('function')} {key}
                                        </h3>
                                        <CodeEditor
                                            onBeforeChange={(
                                                editor,
                                                data,
                                                value
                                            ) => {
                                                functions[key] = value;
                                                setFunctions(
                                                    cloneDeep(functions)
                                                );
                                            }}
                                            readOnly={isDefaultProfile}
                                            value={value}
                                        />
                                    </section>
                                );
                            })}
                    </div>
                </section>
            </section>
        </div>
    );
};
