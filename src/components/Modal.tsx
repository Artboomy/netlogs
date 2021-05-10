import React, { FC, ReactNode } from 'react';
import { createUseStyles } from 'react-jss';
import { mediaQuerySmallOnly } from '../utils';

const useStyles = createUseStyles({
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
        backgroundColor: 'white',
        paddingLeft: '8px',
        borderLeft: '1px solid #eaeaea',
        [mediaQuerySmallOnly]: {
            left: '60px'
        }
    },
    header: {
        padding: '2px',
        borderBottom: '1px solid #eaeaea'
    },
    wrapper: {
        overflow: 'auto',
        overflowWrap: 'break-word'
    }
});
type ModalProps = {
    children: ReactNode;
    onClose: () => void;
};

export const Modal: FC<ModalProps> = ({ children, onClose }) => {
    const styles = useStyles();
    return (
        <div className={styles.root}>
            <div className={styles.header}>
                <button onClick={onClose}>Close</button>
            </div>
            <div className={styles.wrapper}>{children}</div>
        </div>
    );
};
