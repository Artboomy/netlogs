import React, { FC, useCallback, useMemo } from 'react';
import Inspector, {
    chromeDark,
    chromeLight,
    DOMInspector,
    InspectorAsTreeProps
} from 'react-inspector';
import { Image } from './render/Image';
import { useListStore } from 'controllers/network';
import { Webm } from './render/Webm';
import {
    callParentVoid,
    isSerializedFormData,
    isSerializedMultipartFormData,
    isSerializedObject
} from 'utils';
import { AudioPreview } from './render/AudioPreview';
import { useSettings } from 'hooks/useSettings';
import copy from 'copy-to-clipboard';
import { Flip, toast } from 'react-toastify';
import { i18n } from 'translations/i18n';

type TDomData = {
    __mimeType: 'text/html';
    __getRaw: () => string;
};

type TXmlData = {
    __mimeType: 'text/xml';
    __getRaw: () => string;
};

type RawType = Record<string, unknown> | string | null | undefined | number;

type WithMimeType = {
    __mimeType: string;
    __getRaw: () => RawType;
};

type TData = {
    __mimeType?: string;
    __getRaw: () => unknown;
    [key: string]: unknown;
};

type TAbstractData =
    | {
          [key: string]: unknown;
      }
    | unknown[];

export type TAnyData =
    | TAbstractData
    | TData
    | TXmlData
    | TDomData
    | TImageData
    | TVideoWebmData
    | TAudioData;

type TImageData = {
    __mimeType: `image/${string}`;
    __getRaw: () => string;
};

type TVideoWebmData = {
    __mimeType: `video/webm`;
    __getRaw: () => string;
};

type TAudioData = {
    __mimeType: `audio/${string}`;
    __getRaw: () => string;
};

const isTextHtml = (data: unknown): data is TDomData => {
    return Boolean(isMimeType(data) && data.__mimeType === 'text/html');
};

const isImage = (data: unknown): data is TImageData => {
    return Boolean(isMimeType(data) && data.__mimeType.startsWith('image'));
};

const isWebm = (data: unknown): data is TVideoWebmData => {
    return Boolean(isMimeType(data) && data.__mimeType === 'video/webm');
};

const isAudio = (data: unknown): data is TAudioData => {
    return Boolean(isMimeType(data) && data.__mimeType.startsWith('audio'));
};

const isXml = (data: unknown): data is TXmlData => {
    return Boolean(isMimeType(data) && data.__mimeType.endsWith('xml'));
};

export const isMimeType = (data: unknown): data is WithMimeType => {
    return Boolean(data && typeof data === 'object' && '__mimeType' in data);
};

export interface InspectorWrapperProps {
    data: TData | TAbstractData | unknown;
    tagName?: string;
}

function parseRawFormData(rawData: string): Record<string, string> {
    const result: Record<string, string> = {};

    // Split the raw data into parts using the boundary
    const firstLine = rawData.split('\n')[0];
    const boundary = firstLine.trim();
    const parts = rawData
        .split(boundary)
        .filter((part) => part.trim().length > 0);

    parts.forEach((part) => {
        if (part.includes('--\r\n') || part === '--') {
            return;
        }
        const [headersRaw, ...contentParts] = part.split('\r\n\r\n');
        if (!headersRaw || contentParts.length === 0) {
            return;
        }
        const nameMatch = headersRaw.match(/name="([^"]+)"/);
        if (!nameMatch) {
            return;
        }

        const name = nameMatch[1];
        result[name] = contentParts.join('\r\n\r\n').replace(/\r\n$/, '');
    });

    return result;
}

function recursiveTextToObject<T extends RawType>(
    data: T | unknown
): T | unknown {
    // If data is a string and is a serialized object, parse and return it
    if (typeof data === 'string') {
        try {
            if (isSerializedObject(data)) {
                return JSON.parse(data);
            } else if (isSerializedFormData(data)) {
                return Object.fromEntries([...new URLSearchParams(data)]);
            } else if (isSerializedMultipartFormData(data)) {
                return parseRawFormData(data);
            }
        } catch (_e) {
            // console.log('Error parsing JSON', _e, data);
            return data;
        }
    }

    // If data is not an object, return it as is
    if (typeof data !== 'object' || data === null) {
        return data;
    }

    // If data is an object, recursively convert its properties
    if (typeof data === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = Array.isArray(data) ? [] : {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                // eslint-disable-next-line
                // @ts-ignore
                result[key] = recursiveTextToObject(data[key]);
            }
        }
        return result;
    }
    return data;
}

function isObjectWithFormData(data: unknown): data is { FormData: string } {
    return Boolean(
        data && typeof data === 'object' && Object.hasOwn(data, 'FormData')
    );
}

export const InspectorWrapper: FC<InspectorWrapperProps> = ({
    data,
    tagName
}) => {
    const theme = useSettings((state) => state.settings.theme);
    const customTheme = useMemo(
        () => ({
            ...(theme === 'light' ? chromeLight : chromeDark),
            ...{
                OBJECT_PREVIEW_OBJECT_MAX_PROPERTIES: 1,
                OBJECT_PREVIEW_ARRAY_MAX_PROPERTIES: 3,
                BASE_BACKGROUND_COLOR: 'transparent',
                BASE_FONT_SIZE: '12px',
                BASE_LINE_HEIGHT: 1.4,
                TREENODE_FONT_SIZE: '12px',
                TREENODE_LINE_HEIGHT: 1.4
            }
        }),
        [theme]
    );
    const isUnpack = useListStore((state) => state.isUnpack);
    if (isImage(data)) {
        return <Image base64={data.__getRaw()} mimeType={data.__mimeType} />;
    }
    if (isWebm(data)) {
        return <Webm base64={data.__getRaw()} />;
    }
    if (isAudio(data)) {
        return (
            <AudioPreview base64={data.__getRaw()} mimeType={data.__mimeType} />
        );
    }
    if (isTextHtml(data)) {
        const domParser = new DOMParser();
        const renderData = domParser.parseFromString(
            data.__getRaw(),
            'text/html'
        );
        return <DOMInspector data={renderData} theme={customTheme} />;
    }
    if (isXml(data)) {
        const domParser = new DOMParser();
        const renderData = domParser.parseFromString(
            data.__getRaw(),
            'text/xml'
        );
        return <DOMInspector data={renderData} theme={customTheme} />;
    }
    let name = tagName || (isMimeType(data) && data.__mimeType) || 'result';
    const unwrappedData = isMimeType(data) ? data.__getRaw() : data;
    let unwrappedDataWithTextConverted = unwrappedData;
    if (isUnpack) {
        if (isObjectWithFormData(unwrappedData)) {
            const payload = unwrappedData.FormData;
            if (isSerializedFormData(payload)) {
                unwrappedDataWithTextConverted = recursiveTextToObject(
                    Object.fromEntries([
                        ...new URLSearchParams(payload).entries()
                    ])
                );
                name = 'FormData';
            } else if (isSerializedMultipartFormData(payload)) {
                unwrappedDataWithTextConverted = parseRawFormData(payload);
                name = 'FormData';
            }
        } else {
            unwrappedDataWithTextConverted =
                recursiveTextToObject(unwrappedData);
        }
    }
    const handleMouseDown: NonNullable<InspectorAsTreeProps['onMouseDown']> =
        useCallback((event, data) => {
            if (event.button === 1 || event.buttons === 4) {
                try {
                    if (data !== undefined && data !== null) {
                        copy(
                            typeof data === 'string'
                                ? data
                                : // strings to JSON adds extra quotes
                                  JSON.stringify(data, null, 4)
                        );
                        event.stopPropagation();
                        event.preventDefault();
                        toast(i18n.t<string>('copied'), {
                            hideProgressBar: true,
                            autoClose: 300,
                            transition: Flip
                        });
                        callParentVoid('analytics.copyObject');
                    }
                } catch (e) {
                    toast(i18n.t<string>('errorOccurred'));
                    console.error('Error while copying to clipboard', e);
                }
            }
        }, []);
    return (
        <Inspector
            name={name}
            data={unwrappedDataWithTextConverted}
            theme={customTheme}
            onMouseDown={handleMouseDown}
        />
    );
};
