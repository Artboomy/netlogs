import React, { FC, ReactNode } from 'react';
import { createUseStyles } from 'react-jss';
import { mediaQuerySmallOnly } from '../utils';
import { IconButton, ICONS } from './IconButton';
import { Theme } from '../theme/types';

const useStyles = createUseStyles<Theme>((theme) => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: '50%',
        right: 0,
        top: 0,
        bottom: 0,
        // NOTE: should be larger than codemirror z-index
        zIndex: 10,
        backgroundColor: theme.mainBg,
        paddingLeft: '8px',
        borderLeft: `1px solid ${theme.borderColor}`,
        [mediaQuerySmallOnly]: {
            left: '60px'
        }
    },
    header: {
        padding: '2px',
        borderBottom: `1px solid ${theme.borderColor}`
    },
    wrapper: {
        overflow: 'auto',
        overflowWrap: 'break-word'
    }
}));

type ModalProps = {
    children: ReactNode;
    onClose: () => void;
};

export const Modal: FC<ModalProps> = ({ children, onClose }) => {
    const styles = useStyles();
    return (
        <div className={styles.root}>
            <div className={styles.header}>
                <IconButton
                    icon={ICONS.cross}
                    onClick={onClose}
                    title='Close'
                />
            </div>
            <div className={styles.wrapper}>{children}</div>
        </div>
    );
};
