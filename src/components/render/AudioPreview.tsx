import React, { FC, useContext } from 'react';
import { ModalContext } from '../modal/Context';
import { chromeDark, chromeLight } from 'react-inspector';
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

const Base64Text = styled.pre({
    wordBreak: 'break-all',
    whiteSpace: 'pre-wrap'
});

export const AudioPreview: FC<{
    base64: string;
    mimeType: string;
}> = ({ base64, mimeType }) => {
    const { setValue } = useContext(ModalContext);
    const normalizedType = mimeType === 'audio/mpeg3' ? 'audio/mp3' : mimeType;
    const handleClick = () => {
        setValue(
            <div>
                <audio controls>
                    <source src={`data:${normalizedType};base64,${base64}`} />
                </audio>
                <details>
                    <summary>Base64</summary>
                    <Base64Text>{base64}</Base64Text>
                </details>
            </div>
        );
    };
    return (
        <>
            <TagText>{mimeType}: </TagText>
            <button onClick={handleClick}>Listen audio</button>
        </>
    );
};
