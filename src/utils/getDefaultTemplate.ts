import { i18n } from 'translations/i18n';

export const getDefaultTemplate = () => {
    return [
        i18n.t('jira_template_problem'),
        '',
        '',
        i18n.t('jira_template_site'),
        i18n.t('jira_template_steps'),
        i18n.t('jira_template_step1'),
        i18n.t('jira_template_step2'),
        i18n.t('jira_template_step3'),
        '',
        i18n.t('jira_template_actual'),
        '',
        '',
        i18n.t('jira_template_expected'),
        '',
        '',
        i18n.t('jira_template_additional'),
        i18n.t('jira_template_timestamp'),
        i18n.t('jira_service_info'),
        i18n.t('jira_template_footer')
    ].join('\n');
};
