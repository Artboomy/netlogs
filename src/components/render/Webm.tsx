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
    image: {
        height: '24px',
        overflow: 'hidden',
        position: 'absolute',
        top: '4px',
        border: '2px dotted #ccc',
        boxSizing: 'border-box',
        cursor: 'pointer'
    },
    imageFull: {
        border: '2px dotted #ccc',
        objectFit: 'none',
        cursor: 'pointer'
    }
});
export const Webm: FC<{
    base64: string;
}> = ({ base64 }) => {
    const styles = useStyles();
    const { setValue } = useContext(ModalContext);
    const handleClickDiv = (
        event: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
        const target = event.target as HTMLDivElement;
        target.style.backgroundColor =
            target.style.backgroundColor === '' ? 'black' : '';
    };
    const handleClick = () => {
        setValue(
            <div onClick={handleClickDiv}>
                <video controls autoPlay>
                    <source
                        type='video/webm'
                        src={`data:video/webm;base64,${base64}`}
                    />
                </video>
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
