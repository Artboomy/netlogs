import React, { FC } from 'react';
import largeIcons from '../icons/largeIcons.svg';
import { google } from 'base16';
import styled from '@emotion/styled';

const Button = styled.button<{ activeText: boolean }>(
    ({ theme, activeText }) => ({
        appearance: 'none',
        padding: '0',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 'bold',
        ...(activeText
            ? {
                  color: theme.accent,
                  '&:hover': {
                      color: theme.accent
                  }
              }
            : { color: theme.icon.normal })
    })
);

const Icon = styled.div<{ icon: string; variant: '' | 'active' | 'red' }>(
    ({ theme, icon, variant }) => ({
        WebkitMaskPosition: icon,
        WebkitMaskImage: `url(js/${largeIcons})`,
        width: '21px',
        height: '24px',
        ...(!variant && {
            backgroundColor: theme.icon.normal,
            '&:hover': {
                backgroundColor: theme.icon.hover
            }
        }),
        ...(variant === 'active' && {
            backgroundColor: theme.accent,
            '&:hover': {
                backgroundColor: theme.accent
            }
        }),
        ...(variant === 'red' && {
            backgroundColor: google.base08,
            '&:hover': {
                backgroundColor: google.base08
            }
        })
    })
);

export type IconButtonProps = {
    className?: string;
    icon?: `${number}px ${number}px`;
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    title: string;
    active?: boolean;
    children?: React.ReactNode;
};

export const IconButton: FC<IconButtonProps> = ({
    className,
    icon,
    onClick,
    title,
    active,
    children
}) => {
    let variant: '' | 'active' | 'red' = '';
    if (active && icon !== ICONS.debugOn) {
        variant = 'active';
    } else if (icon === ICONS.debugOn) {
        variant = 'red';
    }
    return (
        <Button
            activeText={!!active}
            className={className}
            onClick={onClick}
            title={title}>
            {icon ? <Icon variant={variant} icon={icon} /> : null}
            {children}
        </Button>
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
    inspect: '136px -72px',
    drop: '52px -72px'
} as const;
