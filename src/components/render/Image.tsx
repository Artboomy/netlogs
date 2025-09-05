import React, { FC, useContext } from 'react';
import { chromeDark, chromeLight } from 'react-inspector';
import { ModalContext } from '../modal/Context';
import { theme as themeLight } from 'theme/light';
import { theme as themeDark } from 'theme/dark';
import { i18n } from 'translations/i18n';
import styled from '@emotion/styled';
import { css } from '@emotion/css';
import { SVGIcon } from 'components/render/SVGIcon';

const TagText = styled.span(({ theme }) => ({
    color:
        theme.name === 'light'
            ? chromeLight.OBJECT_NAME_COLOR
            : chromeDark.OBJECT_NAME_COLOR,
    marginRight: '4px',
    fontFamily: chromeLight.BASE_FONT_FAMILY,
    fontSize: '12px'
}));

const ImagePreview = css({
    height: '24px',
    overflow: 'hidden',
    position: 'absolute',
    top: '2px',
    border: '2px dotted #ccc',
    boxSizing: 'border-box',
    cursor: 'pointer'
});

const ImageFull = css({
    border: '2px dotted #ccc',
    objectFit: 'none',
    cursor: 'pointer'
});

const RawData = styled.details({
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    padding: '8px'
});

const isSvg = (input: string): boolean => {
    return input.startsWith('<svg') && input.endsWith('svg>');
};

export const Image: FC<{
    base64: string | undefined;
    mimeType: `image/${string}`;
}> = ({ base64, mimeType }) => {
    const { setValue } = useContext(ModalContext);
    if (!base64) {
        return null;
    }
    const handleClickDiv = (
        event: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
        const target = event.target as HTMLDivElement;
        target.style.backgroundColor =
            target.style.backgroundColor === themeLight.mainBg ||
            !target.style.backgroundColor
                ? themeDark.mainBg
                : themeLight.mainBg;
    };
    const handleClick = () => {
        setValue(
            <div>
                <div onClick={handleClickDiv}>
                    {isSvg(base64) ? (
                        <SVGIcon svgContent={base64} className={ImageFull} />
                    ) : (
                        <img
                            className={ImageFull}
                            src={`data:${mimeType};base64,${base64}`}
                            alt='Image'
                            title={i18n.t('clickImage')}
                        />
                    )}
                </div>
                <RawData>
                    <summary>Raw</summary>
                    {base64}
                </RawData>
            </div>
        );
    };
    return (
        <>
            <TagText>{mimeType}: </TagText>
            {isSvg(base64) ? (
                <SVGIcon
                    svgContent={base64}
                    className={ImagePreview}
                    onClick={handleClick}
                />
            ) : (
                <img
                    className={ImagePreview}
                    src={`data:${mimeType};base64,${base64}`}
                    alt='Image'
                    onClick={handleClick}
                />
            )}
        </>
    );
};
