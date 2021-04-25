import React, { FC } from 'react';
import Inspector, { chromeLight, DOMInspector } from 'react-inspector';
import { Image } from './render/Image';

const customTheme = {
    ...chromeLight,
    ...{
        OBJECT_PREVIEW_OBJECT_MAX_PROPERTIES: 1,
        OBJECT_PREVIEW_ARRAY_MAX_PROPERTIES: 3,
        BASE_BACKGROUND_COLOR: 'transparent',
        BASE_FONT_SIZE: '12px',
        BASE_LINE_HEIGHT: 1.4,
        TREENODE_FONT_SIZE: '12px',
        TREENODE_LINE_HEIGHT: 1.4
    }
};

type TDomData = {
    __mimeType: 'text/html';
    __getRaw: () => string;
};

type TXmlData = {
    __mimeType: 'text/xml';
    __getRaw: () => string;
};

type WithMimeType = {
    __mimeType: string;
    __getRaw: () =>
        | Record<string, unknown>
        | string
        | null
        | undefined
        | number;
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

export type TAnyData = TAbstractData | TData | TXmlData | TDomData | TImageData;

type TImageData = {
    __mimeType: `image/${string}`;
    __getRaw: () => string;
};

const isText = (data: unknown): data is TDomData => {
    return Boolean(isMimeType(data) && data.__mimeType === 'text/html');
};

const isImage = (data: unknown): data is TImageData => {
    return Boolean(isMimeType(data) && data.__mimeType.startsWith('image'));
};

const isXml = (data: unknown): data is TXmlData => {
    return Boolean(isMimeType(data) && data.__mimeType.endsWith('xml'));
};

const isMimeType = (data: unknown): data is WithMimeType => {
    return Boolean(data && typeof data === 'object' && '__mimeType' in data);
};

export const InspectorWrapper: FC<{
    data: TData | TAbstractData | unknown;
    tagName?: string;
}> = ({ data, tagName }) => {
    if (isImage(data)) {
        return <Image base64={data.__getRaw()} mimeType={data.__mimeType} />;
    }
    if (isText(data)) {
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
    const name = tagName || (isMimeType(data) && data.__mimeType) || 'result';
    const unwrappedData = isMimeType(data) ? data.__getRaw() : data;
    return <Inspector name={name} data={unwrappedData} theme={customTheme} />;
};
