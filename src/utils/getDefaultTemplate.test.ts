import { describe, it, expect } from 'vitest';
import { getDefaultTemplate } from './getDefaultTemplate';
import { i18n } from 'translations/i18n';

describe('getDefaultTemplate', () => {
    it('returns template with translated labels', () => {
        const template = getDefaultTemplate();

        expect(template).toContain(i18n.t('jira_template_problem'));
        expect(template).toContain(i18n.t('jira_template_site'));
        expect(template).toContain(i18n.t('jira_template_footer'));
    });
});
