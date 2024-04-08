import React, { FC, useContext } from 'react';
import { chromeDark, chromeLight } from 'react-inspector';
import { ModalContext } from '../modal/Context';
import { theme as themeLight } from 'theme/light';
import { theme as themeDark } from 'theme/dark';
import { i18n } from 'translations/i18n';
import styled from '@emotion/styled';

const TagText = styled.span(({ theme }) => ({
    color:
        theme.name === 'light'
            ? chromeLight.OBJECT_NAME_COLOR
            : chromeDark.OBJECT_NAME_COLOR,
    marginRight: '4px',
    fontFamily: chromeLight.BASE_FONT_FAMILY,
    fontSize: '12px'
}));

const ImagePreview = styled.img({
    height: '24px',
    overflow: 'hidden',
    position: 'absolute',
    top: '4px',
    border: '2px dotted #ccc',
    boxSizing: 'border-box',
    cursor: 'pointer'
});

const ImageFull = styled.img({
    border: '2px dotted #ccc',
    objectFit: 'none',
    cursor: 'pointer'
});

export const Image: FC<{
    base64: string;
    mimeType: `image/${string}`;
}> = ({ base64, mimeType }) => {
    const { setValue } = useContext(ModalContext);
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
            <div onClick={handleClickDiv}>
                <ImageFull
                    src={`data:${mimeType};base64,${base64}`}
                    alt='Image'
                    title={i18n.t('clickImage')}
                />
            </div>
        );
    };
    return (
        <>
            <TagText>{mimeType}: </TagText>
            <ImagePreview
                src={`data:${mimeType};base64,${base64}`}
                alt='Image'
                onClick={handleClick}
            />
        </>
    );
};
