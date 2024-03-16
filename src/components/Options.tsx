import React, {
    ChangeEvent,
    ChangeEventHandler,
    FC,
    useEffect,
    useState
} from 'react';
import { deserializeFunctionsRaw, serialize } from '../controllers/settings';
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
} from '../controllers/settings/types';
import downloadAsFile from '../utils';
import { CodeEditor } from './options/CodeEditor';
import { parseFile } from '../controllers/file';
import { Instructions } from './options/Instructions';
import { Demo } from './options/Demo';
import { useSettings } from '../hooks/useSettings';
import cn from 'classnames';
import { theme } from '../theme/light';
import { HiddenTagList } from './options/HiddenTagList';
import { Link } from './Link';

const useStyles = createUseStyles({
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
});

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
            alert('Cannot save invalid settings');
        }
    };

    const handleReset = () => {
        if (window.confirm('This will wipe all custom settings. Continue?')) {
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
        const name = window.prompt('Profile name');
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
                window.alert(`Profile ${newProfile.name} imported`);
            },
            (e) => window.alert(`Invalid profile ${e.message}`)
        );
    };

    const isDefaultProfile = currentProfile === 'default';

    const styles = useStyles();
    return (
        <div>
            <section className={cn(styles.titleRow, styles.block)}>
                <h1>Options page</h1>
                <div>
                    Links:{' '}
                    <Link
                        href='https://github.com/Artboomy/netlogs'
                        text='Github'
                    />{' '}
                    <Link
                        href='https://chrome.google.com/webstore/detail/net-logs/cjdmhjppaehhblekcplokfdhikmalnaf'
                        text='Chrome store'
                    />{' '}
                    <Link href='https://twitter.com/Artboomy' text='Tweet me' />
                </div>
            </section>
            <section className={styles.block}>
                <h2>Integrations</h2>
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
                        Next.js integration{' '}
                        <span title='Extracts window.__NEXT_DATA__ value'>
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
                        Unwrap{' '}
                        <Link
                            text='JSON-RPC'
                            href='https://www.jsonrpc.org/specification'
                        />{' '}
                        requests
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
                        Send analytics
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
                        Unwrap{' '}
                        <Link text='GraphQL' href='https://graphql.org/' />{' '}
                        requests
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
                        NuxtJS integration{' '}
                        <span title='Extracts window.__NUTXT__ value'>❓</span>
                    </label>
                </div>
            </section>
            <section className={styles.block}>
                <h2>Hidden tags</h2>
                <HiddenTagList />
            </section>
            <section className={cn(styles.block, styles.profilesBlock)}>
                <h2>Profiles</h2>
                <section className={styles.root}>
                    <div className={styles.left}>
                        <div className={styles.header}>
                            <section className={styles.section}>
                                <button onClick={handleSave}>Save</button>
                                <button onClick={handleReset}>Reset</button>
                                <label
                                    htmlFor='file-selector'
                                    role='button'
                                    className={styles.importButton}>
                                    Import profile
                                    <input
                                        type='file'
                                        id='file-selector'
                                        accept='.json'
                                        style={{ display: 'none' }}
                                        onChange={handleImportProfile}
                                    />
                                </label>

                                <button onClick={handleNewProfile}>
                                    New profile
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
                                    Export profile
                                </button>
                                {isDefaultProfile ? (
                                    <h4 className={styles.defaultProfileNote}>
                                        Default profile is not editable
                                    </h4>
                                ) : (
                                    <button onClick={handleDeleteProfile}>
                                        Delete profile
                                    </button>
                                )}
                            </section>
                        </div>
                        <Instructions />
                        <section className={styles.codeBlock}>
                            <h3 id='matcher'>Profile matcher</h3>
                            <i>
                                If returned name is not found - default profile
                                will be used
                            </i>
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
                                        <h3 id={key}>Function {key}</h3>
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
