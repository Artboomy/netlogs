import React, {
    FC,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from 'react';
import styled from '@emotion/styled';
import { callParent } from 'utils';
import { toast } from 'react-toastify';
import { useSettings } from 'hooks/useSettings';
import { ModalContext } from './modal/Context';
import Inspector from 'react-inspector';
import { getFileName, getHarData } from '../utils/harUtils';

import { generateZip } from 'utils/generateZip';
import { i18n } from 'translations/i18n';
import { getDefaultTemplate } from 'utils/getDefaultTemplate';
import { MultiSelectStyled } from './MultiSelectStyled';
import { PasswordInput } from './PasswordInput';

const Form = styled.form(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '8px',
    width: '100%',
    height: '100%',
    overflowY: 'auto',
    backgroundColor: theme.mainBg,
    color: theme.mainFont,
    boxSizing: 'border-box'
}));

const Row = styled.label(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '12px',
    color: theme.mainFont
}));

const DescriptionRow = styled(Row)({
    flex: 1,
    minHeight: '300px'
});

const TitleRow = styled.div({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    h2: {
        margin: 0
    }
});

const Input = styled.input(({ theme }) => ({
    padding: '6px 8px',
    backgroundColor: theme.mainBg,
    color: theme.mainFont,
    border: `1px solid ${theme.borderColor}`,
    '&:focus': {
        borderColor: theme.accent,
        outline: 'none'
    },
    width: '100%',
    boxSizing: 'border-box'
}));

const Select = styled.select(({ theme }) => ({
    padding: '6px 8px',
    backgroundColor: theme.mainBg,
    color: theme.mainFont,
    border: `1px solid ${theme.borderColor}`,
    '&:focus': {
        borderColor: theme.accent,
        outline: 'none'
    },
    width: '100%',
    boxSizing: 'border-box'
}));

const TextArea = styled.textarea(({ theme }) => ({
    padding: '6px 8px',
    minHeight: '280px',
    resize: 'vertical',
    backgroundColor: theme.mainBg,
    color: theme.mainFont,
    border: `1px solid ${theme.borderColor}`,
    '&:focus': {
        borderColor: theme.accent,
        outline: 'none'
    },
    height: '100%'
}));

const Actions = styled.div({
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end'
});

const Button = styled.button(({ theme }) => ({
    padding: '6px 12px',
    cursor: 'pointer',
    backgroundColor: theme.panelColor,
    color: theme.mainFont,
    border: `1px solid ${theme.borderColor}`,
    '&:hover': {
        backgroundColor: theme.rowHover
    },
    '&:disabled': {
        opacity: 0.5,
        cursor: 'not-allowed'
    }
}));

const Hint = styled.div(({ theme }) => ({
    color: theme.section.key,
    fontSize: '12px'
}));

const ErrorBlock = styled.div(({ theme }) => ({
    padding: '8px',
    border: `2px solid ${theme.valueString}`,
    borderRadius: '4px',
    backgroundColor: 'transparent',
    fontSize: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
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
    gap: '8px'
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

type JiraFieldMetadata = {
    key: string;
    name: string;
    type: string;
    allowedValues?: { id: string; value: string }[];
};

type JiraMetadataResponse = {
    ok: boolean;
    fields?: JiraFieldMetadata[];
    allFields?: JiraFieldMetadata[];
    error?: string;
};

export type JiraCachedFields = {
    baseUrl: string;
    projectKey: string;
    issueType: string;
    fields: JiraFieldMetadata[];
    values: Record<string, unknown>;
};

export const buildInitialFieldValues = (fields: JiraFieldMetadata[]) => {
    const initialValues: Record<string, unknown> = {};
    fields.forEach((f) => {
        if (f.type === 'option' || f.type === 'select') {
            initialValues[f.key] = f.allowedValues?.[0]?.id || '';
        } else if (f.type === 'checkbox') {
            initialValues[f.key] = [];
        } else if (f.type === 'array') {
            initialValues[f.key] = f.allowedValues ? [] : '';
        } else {
            initialValues[f.key] = '';
        }
    });
    return initialValues;
};

export const isJiraCacheMatch = (
    cache: JiraCachedFields | null | undefined,
    settings: {
        baseUrl: string;
        projectKey: string;
        issueType: string;
    }
) => {
    if (!cache) {
        return false;
    }
    return (
        cache.baseUrl === settings.baseUrl &&
        cache.projectKey === settings.projectKey &&
        cache.issueType === settings.issueType
    );
};

export const mergeJiraFieldsWithCache = (
    metadataFields: JiraFieldMetadata[],
    allFields: JiraFieldMetadata[],
    cache: JiraCachedFields | null | undefined
) => {
    const initialValues = buildInitialFieldValues(allFields);
    if (!cache) {
        return {
            fields: metadataFields,
            values: initialValues
        };
    }
    const mergedFields = [...metadataFields];
    cache.fields.forEach((field) => {
        if (!mergedFields.some((existing) => existing.key === field.key)) {
            mergedFields.push(field);
        }
    });

    const mergedValues = { ...initialValues, ...cache.values };
    const filteredValues = mergedFields.reduce<Record<string, unknown>>(
        (acc, field) => {
            if (mergedValues[field.key] !== undefined) {
                acc[field.key] = mergedValues[field.key];
            }
            return acc;
        },
        {}
    );

    return {
        fields: mergedFields,
        values: filteredValues
    };
};

export const buildJiraCachedFields = (
    fields: JiraFieldMetadata[],
    values: Record<string, unknown>,
    settings: {
        baseUrl: string;
        projectKey: string;
        issueType: string;
    }
): JiraCachedFields => {
    const filteredValues = fields.reduce<Record<string, unknown>>(
        (acc, field) => {
            if (values[field.key] !== undefined) {
                acc[field.key] = values[field.key];
            }
            return acc;
        },
        {}
    );

    return {
        baseUrl: settings.baseUrl,
        projectKey: settings.projectKey,
        issueType: settings.issueType,
        fields,
        values: filteredValues
    };
};

type JiraIssueResponse = {
    ok: boolean;
    key?: string;
    url?: string;
    error?: string;
    missingFields?: string[];
    details?: {
        url: string;
        project: string;
        issueType: string;
        user: string;
        status?: number;
        statusText?: string;
        response?: unknown;
    };
};

const Required = styled.span(({ theme }) => ({
    color: theme.valueString,
    marginLeft: '4px'
}));

const CollapsibleHeader = styled.div(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 6px',
    backgroundColor: theme.panelColor,
    border: `1px solid ${theme.borderColor}`,
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '12px',
    '&:hover': {
        backgroundColor: theme.rowHover
    }
}));

const CollapsibleContent = styled.div(({ theme }) => ({
    border: `1px solid ${theme.borderColor}`,
    borderTop: 'none',
    borderRadius: '0 0 4px 4px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
}));

const SettingsRow = styled.div({
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '12px'
});

const SettingsActions = styled.div({
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
    marginTop: '4px'
});

const SmallButton = styled(Button)({
    padding: '4px 8px',
    fontSize: '11px'
});

function getSafeJiraUrl(
    url: string | null | undefined,
    jiraBaseUrl: string | null | undefined
): string | null {
    if (!url || !jiraBaseUrl) {
        return null;
    }
    try {
        const parsedUrl = new URL(url);
        const base = new URL(jiraBaseUrl);

        // Only allow http/https URLs pointing to the Jira host
        if (
            (parsedUrl.protocol === 'http:' ||
                parsedUrl.protocol === 'https:') &&
            parsedUrl.hostname === base.hostname
        ) {
            return parsedUrl.toString();
        }
    } catch {
        // Invalid URL; treat as unsafe
    }
    return null;
}

export const JiraTicketModal: FC = () => {
    const jiraSettings = useSettings((state) => state.settings.jira);
    const template = useSettings((state) => state.settings.jira.template);
    const attachScreenshot = useSettings(
        (state) => state.settings.jira.attachScreenshot
    );
    const jiraBaseUrl = useSettings((state) => state.settings.jira.baseUrl);
    const cachedFields = useSettings((state) => state.settings.jira.cachedFields);
    const isReady = useSettings(({ settings }) => {
        const jira = settings.jira;
        return jira.baseUrl && jira.apiToken && jira.projectKey;
    });
    const { setValue } = useContext(ModalContext);

    // Collapsible settings state
    const [localJiraSettings, setLocalJiraSettings] = useState({
        baseUrl: jiraSettings.baseUrl,
        apiToken: jiraSettings.apiToken,
        projectKey: jiraSettings.projectKey,
        issueType: jiraSettings.issueType
    });

    // Check if any primary fields are empty to determine default open state
    const hasEmptyFields =
        !jiraSettings.baseUrl ||
        !jiraSettings.apiToken ||
        !jiraSettings.projectKey ||
        !jiraSettings.issueType;
    const [isSettingsOpen, setIsSettingsOpen] = useState(hasEmptyFields);
    const [settingsSaved, setSettingsSaved] = useState(false);
    const [summary, setSummary] = useState('');
    const [description, setDescription] = useState(
        template || getDefaultTemplate()
    );
    const [dynamicFields, setDynamicFields] = useState<JiraFieldMetadata[]>([]);
    const [allFields, setAllFields] = useState<JiraFieldMetadata[]>([]);
    const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({});
    const cacheMatches = isJiraCacheMatch(cachedFields, {
        baseUrl: jiraSettings.baseUrl,
        projectKey: jiraSettings.projectKey,
        issueType: jiraSettings.issueType
    });

    const refreshMetadata = useCallback(
        async (useCache = true) => {
            if (!isReady) {
                return;
            }
            const response = await callParent('jira.getMetadata');
            const parsed = JSON.parse(response) as JiraMetadataResponse;
            if (parsed.ok && parsed.fields) {
                const metadataFields = parsed.fields;
                const metadataAllFields = parsed.allFields || parsed.fields;
                setAllFields(metadataAllFields);

                const cache =
                    useCache &&
                    isJiraCacheMatch(cachedFields, {
                        baseUrl: jiraSettings.baseUrl,
                        projectKey: jiraSettings.projectKey,
                        issueType: jiraSettings.issueType
                    })
                        ? cachedFields
                        : null;

                const { fields, values } = mergeJiraFieldsWithCache(
                    metadataFields,
                    metadataAllFields,
                    cache
                );

                setDynamicFields(fields);
                setFieldValues(values);
            }
        },
        [
            cachedFields,
            isReady,
            jiraSettings.baseUrl,
            jiraSettings.issueType,
            jiraSettings.projectKey
        ]
    );

    useEffect(() => {
        refreshMetadata();
    }, [refreshMetadata]);

    const [lastError, setLastError] = useState<JiraIssueResponse | null>(null);
    const [lastSuccess, setLastSuccess] = useState<JiraIssueResponse | null>(
        null
    );

    const handleSaveSettings = () => {
        useSettings.getState().patchSettings({
            jira: {
                ...jiraSettings,
                ...localJiraSettings
            }
        });
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2000);
    };

    const handleResetCachedFields = async () => {
        useSettings.getState().patchSettings({
            jira: {
                ...jiraSettings,
                cachedFields: null
            }
        });
        await refreshMetadata(false);
    };

    const handleLocalSettingChange = (
        key: keyof typeof localJiraSettings,
        value: string
    ) => {
        setLocalJiraSettings({
            ...localJiraSettings,
            [key]: value
        });
    };

    const createIssue = async () => {
        setLastError(null);
        setLastSuccess(null);

        let harZipData: string | undefined;
        try {
            const harData = getHarData();
            const fileName = getFileName();
            const zipBlob = await generateZip(
                fileName,
                JSON.stringify(harData)
            );

            // Convert Blob to base64 string to pass through callParent
            harZipData = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(zipBlob);
            });
        } catch (e) {
            console.error('Failed to generate HAR ZIP', e);
        }

        const fields: Record<string, unknown> = {};
        dynamicFields.forEach((f) => {
            const val = fieldValues[f.key];
            if (f.type === 'option' || f.type === 'select') {
                if (val) {
                    fields[f.key] = { id: val };
                }
            } else if (f.type === 'array' && val) {
                if (f.allowedValues && Array.isArray(val)) {
                    fields[f.key] = val.map(
                        (v: { value: string; label: string }) => ({
                            id: v.value
                        })
                    );
                } else if (typeof val === 'string') {
                    // Handle labels (array of strings)
                    fields[f.key] = val
                        .split(';')
                        .map((s) => s.trim())
                        .filter(Boolean);
                }
            } else if (f.type === 'checkbox') {
                // Handle checkboxes (usually an array of objects with value or id)
                if (Array.isArray(val)) {
                    fields[f.key] = val.map((v) => ({ value: v }));
                }
            } else {
                fields[f.key] = val;
            }
        });

        const response = await callParent(
            'jira.createIssue',
            JSON.stringify({
                summary,
                description,
                template: template || getDefaultTemplate(),
                harZipData,
                harFileName: `${getFileName()}.har.zip`,
                attachScreenshot,
                fields
            })
        );
        const parsed = JSON.parse(response) as JiraIssueResponse;
        if (!parsed.ok) {
            setLastError(parsed);
            if (parsed.missingFields && parsed.missingFields.length > 0) {
                const missingFieldKeys = parsed.missingFields;
                const newFields = allFields.filter(
                    (f) =>
                        missingFieldKeys.includes(f.key) &&
                        !dynamicFields.some((df) => df.key === f.key)
                );

                if (newFields.length > 0) {
                    setDynamicFields((prev) => [...prev, ...newFields]);
                    // Initialize missing fields if they don't have values yet
                    setFieldValues((prev) => {
                        const next = { ...prev };
                        newFields.forEach((f) => {
                            if (next[f.key] === undefined) {
                                if (
                                    f.type === 'option' ||
                                    f.type === 'select'
                                ) {
                                    next[f.key] =
                                        f.allowedValues?.[0]?.id || '';
                                } else if (f.type === 'checkbox') {
                                    next[f.key] = [];
                                } else if (f.type === 'array') {
                                    next[f.key] = f.allowedValues ? [] : '';
                                } else {
                                    next[f.key] = '';
                                }
                            }
                        });
                        return next;
                    });
                }
            }
            throw new Error(parsed.error || 'Jira request failed');
        }
        setLastSuccess(parsed);
        useSettings.getState().patchSettings({
            jira: {
                ...jiraSettings,
                cachedFields: buildJiraCachedFields(dynamicFields, fieldValues, {
                    baseUrl: jiraSettings.baseUrl,
                    projectKey: jiraSettings.projectKey,
                    issueType: jiraSettings.issueType
                })
            }
        });
        return parsed;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const issuePromise = createIssue();
        toast.promise(issuePromise, {
            pending: i18n.t('jiraTicketModal_pending'),
            success: {
                render({ data }) {
                    const issue = data as JiraIssueResponse;
                    if (issue.url) {
                        const safeUrl = getSafeJiraUrl(issue.url, jiraBaseUrl);
                        return (
                            <span>
                                {i18n.t('jiraTicketModal_issueCreated')}:{' '}
                                {safeUrl ? (
                                    <a
                                        href={safeUrl}
                                        target='_blank'
                                        rel='noreferrer noopener'>
                                        {issue.key}
                                    </a>
                                ) : (
                                    issue.key
                                )}
                            </span>
                        );
                    }
                    return i18n.t('jiraTicketModal_issueCreated');
                }
            },
            error: {
                render({ data }) {
                    const error = data as Error;
                    return error.message;
                }
            }
        });
        issuePromise
            .then(async () => {
                callParent('analytics.jiraTicketCreated');
                setSummary('');
                setDescription(template || getDefaultTemplate());
            })
            .catch(() => null);
    };

    const errorDetails = useMemo(() => {
        if (!lastError?.details) return [];
        const details = lastError.details;
        const items = [
            { label: 'URL', value: details.url },
            { label: 'Project', value: details.project },
            { label: 'Issue Type', value: details.issueType },
            { label: 'User', value: details.user }
        ];

        if (details.status || details.statusText) {
            items.push({
                label: 'Status',
                value: `${details.status ?? ''} ${details.statusText ?? ''}`
            });
        }

        return items;
    }, [lastError]);

    return (
        <Form onSubmit={handleSubmit}>
            <TitleRow>
                <h2>{i18n.t('jiraTicketModal_title')}</h2>
                <Actions>
                    <Button type='button' onClick={() => setValue(null)}>
                        {i18n.t('jiraTicketModal_cancel')}
                    </Button>
                    <Button
                        type='submit'
                        disabled={!isReady || !summary.trim()}>
                        {i18n.t('jiraTicketModal_create')}
                    </Button>
                </Actions>
            </TitleRow>
            <div>
                <CollapsibleHeader
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
                    <span>
                        {i18n.t('jiraTicketModal_settingsTitle', {
                            defaultValue: 'Jira Settings'
                        })}
                    </span>
                    <span>{isSettingsOpen ? '▼' : '▶'}</span>
                </CollapsibleHeader>
                {isSettingsOpen && (
                    <CollapsibleContent>
                        <SettingsRow>
                            <label>
                                {i18n.t('jiraSettings_baseUrl', {
                                    defaultValue: 'Base URL'
                                })}
                            </label>
                            <Input
                                type='text'
                                placeholder='https://myorg.atlassian.net'
                                value={localJiraSettings.baseUrl}
                                onChange={(e) =>
                                    handleLocalSettingChange(
                                        'baseUrl',
                                        e.target.value
                                    )
                                }
                            />
                        </SettingsRow>
                        <SettingsRow>
                            <label>
                                {i18n.t('jiraSettings_apiToken', {
                                    defaultValue: 'API Token (PAT)'
                                })}
                                <a
                                    href='https://confluence.atlassian.com/enterprise/using-personal-access-tokens-1026032365.html#UsingPersonalAccessTokens-CreatingPATsintheapplication'
                                    target='_blank'
                                    rel='noreferrer'
                                    style={{ marginLeft: '8px' }}>
                                    ?
                                </a>
                            </label>
                            <PasswordInput
                                placeholder='your-api-token-here'
                                value={localJiraSettings.apiToken}
                                onChange={(value) =>
                                    handleLocalSettingChange('apiToken', value)
                                }
                            />
                        </SettingsRow>
                        <SettingsRow>
                            <label>
                                {i18n.t('jiraSettings_projectKey', {
                                    defaultValue: 'Project Key'
                                })}
                            </label>
                            <Input
                                type='text'
                                placeholder='MYPROJ'
                                value={localJiraSettings.projectKey}
                                onChange={(e) =>
                                    handleLocalSettingChange(
                                        'projectKey',
                                        e.target.value
                                    )
                                }
                            />
                        </SettingsRow>
                        <SettingsRow>
                            <label>
                                {i18n.t('jiraSettings_issueType', {
                                    defaultValue: 'Issue Type'
                                })}
                            </label>
                            <Input
                                type='text'
                                placeholder='Bug'
                                value={localJiraSettings.issueType}
                                onChange={(e) =>
                                    handleLocalSettingChange(
                                        'issueType',
                                        e.target.value
                                    )
                                }
                            />
                        </SettingsRow>
                        <SettingsActions>
                            {cacheMatches && (
                                <SmallButton
                                    type='button'
                                    onClick={handleResetCachedFields}>
                                    {i18n.t('jiraTicketModal_resetCachedFields', {
                                        defaultValue: 'Reset cached fields'
                                    })}
                                </SmallButton>
                            )}
                            <SmallButton
                                type='button'
                                onClick={handleSaveSettings}>
                                {settingsSaved
                                    ? i18n.t('saved', {
                                          defaultValue: 'Saved!'
                                      })
                                    : i18n.t('save', { defaultValue: 'Save' })}
                            </SmallButton>
                        </SettingsActions>
                    </CollapsibleContent>
                )}
            </div>

            {/*<Hint>{callUrl}</Hint>*/}
            {!isReady && <Hint>{i18n.t('jiraTicketModal_notReadyHint')}</Hint>}
            {lastSuccess && (
                <SuccessBlock>
                    <span>
                        {i18n.t('jiraTicketModal_issueCreated')}:{' '}
                        {(() => {
                            const safeUrl = getSafeJiraUrl(
                                lastSuccess.url,
                                jiraBaseUrl
                            );
                            if (!safeUrl) {
                                return lastSuccess.key;
                            }
                            return (
                                <a
                                    href={safeUrl}
                                    target='_blank'
                                    rel='noreferrer noopener'>
                                    {lastSuccess.key}
                                </a>
                            );
                        })()}
                    </span>
                </SuccessBlock>
            )}
            {lastError && (
                <ErrorBlock>
                    <ErrorTitle>{lastError.error}</ErrorTitle>
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
                    {lastError.details?.response ? (
                        <ErrorItem>
                            <ErrorLabel>
                                {i18n.t('jiraTicketModal_errorLabelResponse')}:
                            </ErrorLabel>
                            <Inspector data={lastError.details.response} />
                        </ErrorItem>
                    ) : null}
                </ErrorBlock>
            )}
            <Row>
                <span>
                    {i18n.t('jiraTicketModal_summary')}
                    <Required>*</Required>
                </span>
                <Input
                    type='text'
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                />
            </Row>
            {dynamicFields.map((field) => (
                <Row key={field.key}>
                    <span>
                        {field.name}
                        <Required>*</Required>
                    </span>
                    {field.type === 'option' || field.type === 'select' ? (
                        <Select
                            value={(fieldValues[field.key] as string) || ''}
                            onChange={(e) =>
                                setFieldValues((prev) => ({
                                    ...prev,
                                    [field.key]: e.target.value
                                }))
                            }>
                            {field.allowedValues?.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                    {opt.value}
                                </option>
                            ))}
                        </Select>
                    ) : field.type === 'array' ? (
                        field.allowedValues ? (
                            <MultiSelectStyled
                                options={field.allowedValues.map((v) => ({
                                    label: v.value,
                                    value: v.id
                                }))}
                                value={
                                    (fieldValues[field.key] as {
                                        label: string;
                                        value: string;
                                    }[]) || []
                                }
                                onChange={(val: unknown) =>
                                    setFieldValues((prev) => ({
                                        ...prev,
                                        [field.key]: val
                                    }))
                                }
                                labelledBy={field.name}
                            />
                        ) : (
                            <Input
                                type='text'
                                placeholder='label1;label2'
                                value={(fieldValues[field.key] as string) || ''}
                                onChange={(e) =>
                                    setFieldValues((prev) => ({
                                        ...prev,
                                        [field.key]: e.target.value
                                    }))
                                }
                            />
                        )
                    ) : field.type === 'checkbox' ? (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px'
                            }}>
                            {field.allowedValues?.map((opt) => (
                                <label
                                    key={opt.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                    <input
                                        type='checkbox'
                                        checked={(
                                            (fieldValues[
                                                field.key
                                            ] as string[]) || []
                                        ).includes(opt.value)}
                                        onChange={(e) => {
                                            const current =
                                                (fieldValues[
                                                    field.key
                                                ] as string[]) || [];
                                            const next = e.target.checked
                                                ? [...current, opt.value]
                                                : current.filter(
                                                      (v) => v !== opt.value
                                                  );
                                            setFieldValues((prev) => ({
                                                ...prev,
                                                [field.key]: next
                                            }));
                                        }}
                                    />
                                    {opt.value}
                                </label>
                            ))}
                        </div>
                    ) : (
                        <Input
                            type='text'
                            value={(fieldValues[field.key] as string) || ''}
                            onChange={(e) =>
                                setFieldValues((prev) => ({
                                    ...prev,
                                    [field.key]: e.target.value
                                }))
                            }
                        />
                    )}
                </Row>
            ))}
            <DescriptionRow>
                {i18n.t('jiraTicketModal_description')}
                <TextArea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={Math.min(description.split('\n').length + 3, 10)}
                />
            </DescriptionRow>
        </Form>
    );
};
