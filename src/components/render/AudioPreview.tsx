import React, { FC, useContext } from 'react';
import { ModalContext } from '../modal/Context';
import { createUseStyles } from 'react-jss';
import { chromeLight } from 'react-inspector';

const useStyles = createUseStyles({
    tag: {
        color: String(chromeLight.OBJECT_NAME_COLOR),
        marginRight: '4px',
        fontFamily: String(chromeLight.BASE_FONT_FAMILY),
        fontSize: '12px'
    },
    base64: {
        wordBreak: 'break-all',
        whiteSpace: 'pre-wrap'
    }
});

export const AudioPreview: FC<{
    base64: string;
    mimeType: string;
}> = ({ base64, mimeType }) => {
    const styles = useStyles();
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
                    <pre className={styles.base64}>{base64}</pre>
                </details>
            </div>
        );
    };
    return (
        <>
            <span className={styles.tag}>{mimeType}: </span>
            <button onClick={handleClick}>Listen audio</button>
        </>
    );
};
