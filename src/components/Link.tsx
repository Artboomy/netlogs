import React, { FC } from 'react';
import { callParentVoid } from '../utils';

type LinkProps = {
    text: string;
    href: string;
};
export const Link: FC<LinkProps> = ({ text, href }) => {
    const handleClick = (event: React.MouseEvent) => {
        event.preventDefault();
        callParentVoid('chrome.tabs.create', href);
        return false;
    };

    return (
        <a href={href} onClick={handleClick}>
            {text}
        </a>
    );
};
