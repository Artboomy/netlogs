import React, { FC, useContext } from 'react';
import { createUseStyles } from 'react-jss';
import { chromeLight } from 'react-inspector';
import { ModalContext } from '../modal/Context';
import { theme as themeLight } from 'theme/light';
import { theme as themeDark } from 'theme/dark';
import { i18n } from 'translations/i18n';

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
export const Image: FC<{
    base64: string;
    mimeType: `image/${string}`;
}> = ({ base64, mimeType }) => {
    const styles = useStyles();
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
                <img
                    src={`data:${mimeType};base64,${base64}`}
                    alt='Image'
                    title={i18n.t('clickImage')}
                    className={styles.imageFull}
                />
            </div>
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
