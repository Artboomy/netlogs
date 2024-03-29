import React, { FC, useContext } from 'react';
import { createUseStyles } from 'react-jss';
import { chromeLight } from 'react-inspector';
import { ModalContext } from '../modal/Context';

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
export const Webm: FC<{
    base64: string;
}> = ({ base64 }) => {
    const styles = useStyles();
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
                    <pre className={styles.base64}>{base64}</pre>
                </details>
            </div>
        );
    };
    return (
        <>
            <span className={styles.tag}>video/webm: </span>
            <button onClick={handleClick}>Preview video</button>
        </>
    );
};
