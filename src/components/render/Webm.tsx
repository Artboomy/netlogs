import React, { FC, useContext } from 'react';
import { chromeDark, chromeLight } from 'react-inspector';
import { ModalContext } from '../modal/Context';
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

export const Webm: FC<{
    base64: string;
}> = ({ base64 }) => {
    const { setValue } = useContext(ModalContext);
    const handleClick = () => {
        setValue(
            <div>
                <video controls autoPlay>
                    <source
                        type='video/webm'
                        src={`data:video/webm;base64,${base64}`}
                    />
                </video>
                <details>
                    <summary>Base64</summary>
                    <Base64Text>{base64}</Base64Text>
                </details>
            </div>
        );
    };
    return (
        <>
            <TagText>video/webm: </TagText>
            <button onClick={handleClick}>Preview video</button>
        </>
    );
};
