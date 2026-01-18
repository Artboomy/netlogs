import { describe, expect, it } from 'vitest';
import {
    buildJiraCachedFields,
    isJiraCacheMatch,
    mergeJiraFieldsWithCache,
    type JiraCachedFields
} from './JiraTicketModal';

describe('JiraTicketModal cache helpers', () => {
    it('matches cache scope by Jira settings', () => {
        const cache: JiraCachedFields = {
            baseUrl: 'https://jira.example.com',
            projectKey: 'APP',
            issueType: 'Task',
            fields: [],
            values: {}
        };

        expect(
            isJiraCacheMatch(cache, {
                baseUrl: 'https://jira.example.com',
                projectKey: 'APP',
                issueType: 'Task'
            })
        ).toBe(true);

        expect(
            isJiraCacheMatch(cache, {
                baseUrl: 'https://jira.example.com',
                projectKey: 'APP',
                issueType: 'Bug'
            })
        ).toBe(false);
    });

    it('merges cached fields and values with metadata', () => {
        const metadataFields = [
            {
                key: 'priority',
                name: 'Priority',
                type: 'option',
                allowedValues: [{ id: '1', value: 'P1' }]
            }
        ];
        const allFields = [
            ...metadataFields,
            { key: 'severity', name: 'Severity', type: 'string' }
        ];
        const cache: JiraCachedFields = {
            baseUrl: 'https://jira.example.com',
            projectKey: 'APP',
            issueType: 'Task',
            fields: [{ key: 'severity', name: 'Severity', type: 'string' }],
            values: {
                severity: 'High',
                extra: 'ignored'
            }
        };

        const merged = mergeJiraFieldsWithCache(
            metadataFields,
            allFields,
            cache
        );

        expect(merged.fields.map((field) => field.key)).toEqual([
            'priority',
            'severity'
        ]);
        expect(merged.values).toEqual({ priority: '1', severity: 'High' });
    });

    it('builds cached payload from active fields', () => {
        const fields = [
            { key: 'severity', name: 'Severity', type: 'string' },
            { key: 'priority', name: 'Priority', type: 'option' }
        ];

        const cache = buildJiraCachedFields(fields, {
            severity: 'Low',
            priority: '2',
            extra: 'ignored'
        }, {
            baseUrl: 'https://jira.example.com',
            projectKey: 'APP',
            issueType: 'Task'
        });

        expect(cache.values).toEqual({ severity: 'Low', priority: '2' });
        expect(cache.fields).toEqual(fields);
    });
});
