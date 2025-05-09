import { IProfile } from '../types';
import { NetworkRequest } from 'models/types';
import { PropTreeProps } from 'components/PropTree';
import { isSerializedFormData, isSerializedMultipartFormData } from 'utils';

export const defaultProfile: IProfile = {
    functions: {
        getName: function (request: NetworkRequest): string {
            // Shown in third column, after date and tag
            const urlObj = new URL(request.request.url);
            return urlObj.pathname;
        },
        getTag: function (networkRequest: NetworkRequest): string {
            // Shown in rounded box
            const { request, response } = networkRequest;
            return `${request.method}${
                response.status !== 200 ? `/${response.status}` : ''
            }`;
        },
        getParams: function (request: NetworkRequest): Record<string, unknown> {
            let params;
            const postData = request.request.postData;
            const method = request.request.method;
            if (
                (method === 'POST' || method === 'PATCH' || method === 'PUT') &&
                postData
            ) {
                if (postData.text) {
                    try {
                        params = JSON.parse(postData.text);
                    } catch (_e) {
                        const key =
                            isSerializedMultipartFormData(postData.text) ||
                            isSerializedFormData(postData.text)
                                ? 'FormData'
                                : 'text';
                        params = {
                            [key]: postData.text
                        };
                    }
                } else {
                    params = {};
                }
            } else {
                const internalParams: Record<string, string> = {};
                const url = new URL(request.request.url);
                for (const [key, value] of url.searchParams) {
                    internalParams[key] = value;
                }
                params = internalParams;
            }
            return params;
        },
        getMeta: function (request: NetworkRequest): PropTreeProps['data'] {
            // this meta will be shown on separate panel on date click
            return {
                General: {
                    title: 'General',
                    items: [
                        {
                            name: 'Request URL',
                            value: request.request.url
                        },
                        {
                            name: 'Request Method',
                            value: request.request.method
                        },
                        {
                            name: 'Status Code',
                            value: request.response.status
                        },
                        {
                            name: 'Remote Address',
                            value: request.serverIPAddress
                        }
                    ]
                },
                'Response headers': {
                    title: 'Response headers',
                    items: request.response.headers
                },
                'Request headers': {
                    title: 'Request headers',
                    items: request.request.headers
                },
                Timings: {
                    title: 'Timings',
                    items: Object.entries(request.timings).map(
                        ([key, value]) => ({ name: key, value })
                    )
                }
            };
        },
        isError: function (request: NetworkRequest): boolean {
            // use this method to paint tag red
            const status = request.response.status;
            return status > 399 || status === 0;
        },
        shouldShow: function (request: NetworkRequest): boolean {
            // method for filtering inessential requests
            const urlObj = new URL(request.request.url);
            return (
                !request.request.url.startsWith('ws') &&
                !urlObj.pathname.match(
                    /(js|css|woff|woff2|svg|jpg|png|ttf|mp4)$/gim
                )
            );
        },
        getResult: function (
            request: NetworkRequest,
            content: string | undefined
        ): Record<string, unknown> | unknown {
            // do NOT use request.response.content.text, it is not guaranteed to have value
            // always use `content` arg
            // if you want IMAGE preview to work, do NOT edit this
            const { mimeType } = request.response.content;
            let convertedContent: Record<string, unknown> | string | undefined =
                content;
            if (mimeType.includes('json')) {
                if (content) {
                    try {
                        convertedContent = JSON.parse(content);
                    } catch (_e) {
                        // this may indicate a problem with json structure
                        // or bad mimeType
                        // logging this may flood the console, so no console.error in default profile
                    }
                }
            }
            return convertedContent;
        }
    }
};
