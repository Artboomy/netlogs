import React, { FC, useEffect, useMemo, useState } from 'react';
import { useSettings } from 'hooks/useSettings';
import { i18n } from 'translations/i18n';
import styled from '@emotion/styled';
import { Block } from './Block';
import Inspector from 'react-inspector';
import { ISettings } from 'controllers/settings/types';
import { getDefaultTemplate } from 'utils/getDefaultTemplate';
import { PasswordInput } from '../PasswordInput';

const Grid = styled.div`
    display: grid;
    grid-template-columns: 250px minmax(0, 500px);
    gap: 8px;
    align-items: center;
    justify-items: start;

    textarea,
    input:not([type='checkbox']) {
        width: 100%;
        box-sizing: border-box;
    }

    textarea {
        min-height: 300px;
        resize: vertical;
    }
`;

const TitleRow = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 8px;
    margin-bottom: 16px;

    h2 {
        margin: 0;
    }
`;

const ErrorBlock = styled.div(({ theme }) => ({
    padding: '8px',
    border: `2px solid ${theme.valueString}`,
    borderRadius: '4px',
    backgroundColor: 'transparent',
    fontSize: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '16px',
    gridColumn: '1 / -1',
    width: '100%',
    boxSizing: 'border-box'
}));

const SuccessBlock = styled.div(({ theme }) => ({
    padding: '8px',
    border: `2px solid ${theme.name === 'dark' ? theme.dateColor : '#28a745'}`,
    borderRadius: '4px',
    backgroundColor: 'transparent',
    color: theme.name === 'dark' ? theme.dateColor : '#28a745',
    fontSize: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '16px',
    gridColumn: '1 / -1',
    width: '100%',
    boxSizing: 'border-box'
}));

const ErrorTitle = styled.div({
    fontWeight: 'bold'
});

const ErrorItem = styled.div({
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
});

const ErrorLabel = styled.span({
    fontWeight: 'bold',
    marginRight: '4px'
});

const Checkmark = styled.span(({ theme }) => ({
    color: theme.name === 'dark' ? theme.dateColor : '#28a745',
    fontWeight: 'bold',
    marginLeft: '8px'
}));

type JiraIssueResponse = {
    ok: boolean;
    error?: string;
    details?: {
        url: string;
        project: string;
        issueType: string;
        status?: number;
        statusText?: string;
        response?: unknown;
    };
};

type JiraEditableSettings = Pick<
    ISettings['jira'],
    | 'baseUrl'
    | 'apiToken'
    | 'projectKey'
    | 'issueType'
    | 'apiVersion'
    | 'attachScreenshot'
    | 'openTicketInNewTab'
    | 'template'
    | 'user'
>;

const jiraOptionKeys: Array<keyof JiraEditableSettings> = [
    'baseUrl',
    'apiToken',
    'projectKey',
    'issueType',
    'apiVersion',
    'attachScreenshot',
    'openTicketInNewTab',
    'template',
    'user'
];

const placeholders: Partial<Record<keyof JiraEditableSettings, string>> = {
    baseUrl: 'https://myorg.atlassian.net',
    apiToken: 'your-api-token-here',
    projectKey: 'MYPROJ',
    user: 'name@example.com'
};

const getEditableJiraSettings = (
    settings: ISettings['jira']
): JiraEditableSettings => ({
    baseUrl: settings.baseUrl,
    apiToken: settings.apiToken,
    projectKey: settings.projectKey,
    issueType: settings.issueType,
    apiVersion: settings.apiVersion,
    attachScreenshot: settings.attachScreenshot,
    openTicketInNewTab: settings.openTicketInNewTab,
    template: settings.template,
    user: settings.user
});

export const JiraOptions: FC = () => {
    const jiraSettings = useSettings(({ settings }) => settings.jira);
    const [localJira, setLocalJira] = useState(() =>
        getEditableJiraSettings(jiraSettings)
    );
    const [isSaved, setIsSaved] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<JiraIssueResponse | null>(
        null
    );

    useEffect(() => {
        setLocalJira(getEditableJiraSettings(jiraSettings));
    }, [jiraSettings]);

    const handleSave = () => {
        useSettings.getState().patchSettings({
            jira: {
                ...jiraSettings,
                ...localJira
            }
        });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleChange = (
        key: keyof typeof localJira,
        value: string | boolean
    ) => {
        setLocalJira({
            ...localJira,
            [key]: value
        });
    };

    const handleTestSettings = async () => {
        setIsTesting(true);
        setTestResult(null);
        try {
            // first save current local settings to make sure we test what is on the screen
            useSettings.getState().patchSettings({
                jira: {
                    ...jiraSettings,
                    ...localJira
                }
            });
            const response = await new Promise<string>((resolve) => {
                chrome.runtime.sendMessage(
                    { type: 'jira.testSettings', requestId: 'options' },
                    (response) => resolve(response)
                );
            });
            const parsed = JSON.parse(response) as JiraIssueResponse;
            setTestResult(parsed);
        } catch (e) {
            setTestResult({
                ok: false,
                error: String(e)
            });
        } finally {
            setIsTesting(false);
        }
    };

    const errorDetails = useMemo(() => {
        if (!testResult?.details) return [];
        const details = testResult.details;
        const items = [
            { label: 'URL', value: details.url },
            { label: 'Project', value: details.project },
            { label: 'Issue Type', value: details.issueType }
        ];

        if (details.status || details.statusText) {
            items.push({
                label: 'Status',
                value: `${details.status ?? ''} ${details.statusText ?? ''}`
            });
        }

        return items;
    }, [testResult]);

    return (
        <Block>
            <TitleRow>
                <h2>Jira</h2>
                <button onClick={handleSave}>
                    {isSaved ? i18n.t('saved') : i18n.t('save')}
                </button>
                <button onClick={handleTestSettings} disabled={isTesting}>
                    {isTesting
                        ? i18n.t('jira_testing')
                        : i18n.t('jira_checkSettings')}
                </button>
                {testResult?.ok && <Checkmark>✓</Checkmark>}
            </TitleRow>
            <Grid>
                {testResult?.ok && (
                    <SuccessBlock>
                        {i18n.t('jira_testSuccess', {
                            defaultValue: 'Jira settings are correct!'
                        })}
                    </SuccessBlock>
                )}
                {testResult && !testResult.ok && (
                    <ErrorBlock>
                        <ErrorTitle>
                            {i18n.t(testResult.error || '', {
                                defaultValue: testResult.error,
                                project: testResult.details?.project,
                                issueType: testResult.details?.issueType
                            })}
                        </ErrorTitle>
                        {errorDetails.map((item) => (
                            <ErrorItem key={item.label}>
                                <ErrorLabel>
                                    {i18n.t(
                                        `jiraTicketModal_errorLabel${item.label.replace(
                                            ' ',
                                            ''
                                        )}`,
                                        { defaultValue: item.label }
                                    )}
                                    :
                                </ErrorLabel>
                                {item.value}
                            </ErrorItem>
                        ))}
                        {testResult.details?.response ? (
                            <ErrorItem>
                                <ErrorLabel>
                                    {i18n.t(
                                        'jiraTicketModal_errorLabelResponse'
                                    )}
                                    :
                                </ErrorLabel>
                                <Inspector data={testResult.details.response} />
                            </ErrorItem>
                        ) : null}
                    </ErrorBlock>
                )}
                {jiraOptionKeys.map((key) => (
                    <React.Fragment key={key}>
                            <label htmlFor={`jira-${key}`}>
                                {i18n.t(`jiraSettings_${key}`)}
                                {key === 'apiToken' && (
                                    <a
                                        href='https://confluence.atlassian.com/enterprise/using-personal-access-tokens-1026032365.html#UsingPersonalAccessTokens-CreatingPATsintheapplication'
                                        target='_blank'
                                        rel='noreferrer'
                                        style={{ marginLeft: '8px' }}>
                                        ?
                                    </a>
                                )}
                            </label>
                            {key === 'template' ? (
                                <textarea
                                    id={`jira-${key}`}
                                    value={
                                        (localJira[key] as string) ||
                                        getDefaultTemplate()
                                    }
                                    onChange={(e) =>
                                        handleChange(key, e.target.value)
                                    }
                                />
                            ) : key === 'attachScreenshot' ||
                              key === 'openTicketInNewTab' ? (
                                <input
                                    id={`jira-${key}`}
                                    type='checkbox'
                                    checked={localJira[key] as boolean}
                                    onChange={(e) =>
                                        handleChange(key, e.target.checked)
                                    }
                                />
                            ) : key === 'apiToken' ? (
                                <PasswordInput
                                    id={`jira-${key}`}
                                    placeholder={placeholders[key]}
                                    value={localJira[key] as string}
                                    onChange={(value) =>
                                        handleChange(key, value)
                                    }
                                />
                            ) : (
                                <input
                                    id={`jira-${key}`}
                                    type='text'
                                    placeholder={placeholders[key]}
                                    value={localJira[key] as string}
                                    onChange={(e) =>
                                        handleChange(key, e.target.value)
                                    }
                                />
                            )}
                        </React.Fragment>
                    )
                )}
            </Grid>
        </Block>
    );
};
