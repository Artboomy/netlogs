import React, { FC } from 'react';
import { createUseStyles } from 'react-jss';
import largeIcons from '../icons/largeIcons.svg';
import cn from 'classnames';
import { theme } from '../theme/light';
console.info('largeIcons', largeIcons);
const useStyles = createUseStyles({
    button: {
        appearance: 'none',
        padding: '0',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer'
    },
    icon: {
        backgroundColor: theme.icon.normal,
        '-webkit-mask-position': ({ icon }) => icon,
        '-webkit-mask-image': `url(${largeIcons})`,
        width: '21px',
        height: '24px',
        '&:hover': {
            backgroundColor: theme.icon.hover
        }
    }
});

export type IconButtonProps = {
    className?: string;
    icon: `${number}px ${number}px`;
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    title: string;
};

export const IconButton: FC<IconButtonProps> = ({
    className,
    icon,
    onClick,
    title
}) => {
    const styles = useStyles({ icon: icon });
    return (
        <button
            className={cn(styles.button, className)}
            onClick={onClick}
            title={title}>
            <div className={styles.icon} />
        </button>
    );
};

export const ICONS: Record<string, IconButtonProps['icon']> = {
    clear: '0px 144px',
    settings: '-168px 168px',
    export: '-196px 144px',
    cross: '-84px 216px'
};
