import React, { FC, useContext, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { callParent } from 'utils';
import { toast } from 'react-toastify';
import { useSettings } from 'hooks/useSettings';
import { ModalContext } from './modal/Context';
import Inspector from 'react-inspector';
import { getFileName, getHarData } from './Header';

import { generateZip } from 'utils/generateZip';
import { i18n } from 'translations/i18n';
import { getDefaultTemplate } from 'utils/getDefaultTemplate';

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
    minHeight: '200px'
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
    }
}));

const TextArea = styled.textarea(({ theme }) => ({
    padding: '6px 8px',
    minHeight: '120px',
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

type JiraIssueResponse = {
    ok: boolean;
    key?: string;
    url?: string;
    error?: string;
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

export const JiraTicketModal: FC = () => {
    const template = useSettings((state) => state.settings.jira.template);
    const attachScreenshot = useSettings(
        (state) => state.settings.jira.attachScreenshot
    );
    const isReady = useSettings(({ settings }) => {
        const jira = settings.jira;
        return jira.baseUrl && jira.user && jira.apiToken && jira.projectKey;
    });
    const { setValue } = useContext(ModalContext);
    const [summary, setSummary] = useState('');
    const [description, setDescription] = useState(
        template || getDefaultTemplate()
    );

    const [lastError, setLastError] = useState<JiraIssueResponse | null>(null);
    const [lastSuccess, setLastSuccess] = useState<JiraIssueResponse | null>(
        null
    );
    // const callUrl = useSettings(({ settings }) => {
    //     const jira = settings.jira;
    //     if (!jira.baseUrl) return '';
    //     const apiVersion = jira.apiVersion || '3';
    //     const baseUrl = jira.baseUrl.replace(/\/+$/, '');
    //     return `${baseUrl}/rest/api/${apiVersion}/issue`;
    // });

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

        const response = await callParent(
            'jira.createIssue',
            JSON.stringify({
                summary,
                description,
                template: template || getDefaultTemplate(),
                harZipData,
                harFileName: `${getFileName()}.har.zip`,
                attachScreenshot
            })
        );
        console.log('createIssue response', response);
        const parsed = JSON.parse(response) as JiraIssueResponse;
        if (!parsed.ok) {
            setLastError(parsed);
            throw new Error(parsed.error || 'Jira request failed');
        }
        setLastSuccess(parsed);
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
                        return (
                            <span>
                                {i18n.t('jiraTicketModal_issueCreated')}:{' '}
                                <a
                                    href={issue.url}
                                    target='_blank'
                                    rel='noreferrer noopener'>
                                    {issue.key}
                                </a>
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
            {/*<Hint>{callUrl}</Hint>*/}
            {!isReady && <Hint>{i18n.t('jiraTicketModal_notReadyHint')}</Hint>}
            {lastSuccess && (
                <SuccessBlock>
                    <span>
                        {i18n.t('jiraTicketModal_issueCreated')}:{' '}
                        <a
                            href={lastSuccess.url}
                            target='_blank'
                            rel='noreferrer noopener'>
                            {lastSuccess.key}
                        </a>
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
            <DescriptionRow>
                {i18n.t('jiraTicketModal_description')}
                <TextArea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                />
            </DescriptionRow>
        </Form>
    );
};
