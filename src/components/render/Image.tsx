import React, { FC, useContext } from 'react';
import { createUseStyles } from 'react-jss';
import { chromeLight } from 'react-inspector';
import { ModalContext } from '../modal/Context';

const useStyles = createUseStyles({
    tag: {
        verticalAlign: 'sub',
        color: String(chromeLight.OBJECT_NAME_COLOR),
        marginRight: '4px',
        fontFamily: String(chromeLight.BASE_FONT_FAMILY),
        fontSize: '13px'
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
        objectFit: 'none'
    }
});
export const Image: FC<{
    base64: string;
    mimeType: `image/${string}`;
}> = ({ base64, mimeType }) => {
    const styles = useStyles();
    const { setValue } = useContext(ModalContext);
    const handleClick = () => {
        setValue(
            <img
                src={`data:${mimeType};base64,${base64}`}
                alt='Image'
                className={styles.imageFull}
            />
        );
    };
    return (
        <>
            <span className={styles.tag}>{mimeType}: </span>
            <img
                src={`data:${mimeType};base64,${base64}`}
                alt='Image'
                className={styles.image}
                onClick={handleClick}
            />
        </>
    );
};
