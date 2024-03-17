import React, { FC } from 'react';
import { createUseStyles } from 'react-jss';
import largeIcons from '../icons/largeIcons.svg';
import cn from 'classnames';
import { theme } from '../theme/light';
import { google } from 'base16';

const useStyles = createUseStyles({
    button: {
        appearance: 'none',
        padding: '0',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 'bold'
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
    },
    active: {
        backgroundColor: theme.accent,
        '&:hover': {
            backgroundColor: theme.accent
        }
    },
    activeRed: {
        backgroundColor: google.base08,
        '&:hover': {
            backgroundColor: google.base08
        }
    },
    activeText: {
        color: theme.accent,
        '&:hover': {
            color: theme.accent
        }
    }
});

export type IconButtonProps = {
    className?: string;
    icon?: `${number}px ${number}px`;
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    title: string;
    active?: boolean;
};

export const IconButton: FC<IconButtonProps> = ({
    className,
    icon,
    onClick,
    title,
    active,
    children
}) => {
    const styles = useStyles({ icon: icon });
    return (
        <button
            className={cn(styles.button, className, {
                [styles.activeText]: active
            })}
            onClick={onClick}
            title={title}>
            {icon ? (
                <div
                    className={cn(styles.icon, {
                        [styles.active]: active && icon !== ICONS.debugOn,
                        [styles.activeRed]: icon === ICONS.debugOn
                    })}
                />
            ) : null}
            {children}
        </button>
    );
};

export const ICONS: Record<string, IconButtonProps['icon']> = {
    clear: '-4px 144px',
    brackets: '-60px 48px',
    settings: '-168px 168px',
    export: '-199px 144px',
    cross: '-84px 216px',
    filter: '-56px 120px',
    panelDown: '-116px 0px',
    panelRight: '136px 168px',
    panelUp: '136px -72px',
    debugOff: '-172px 264px',
    debugOn: '-88px 24px',
    inspect: '136px -72px'
} as const;
