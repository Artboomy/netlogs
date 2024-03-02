import React, { FC } from 'react';

type LinkProps = {
    text: string;
    href: string;
};
export const Link: FC<LinkProps> = ({ text, href }) => {
    return (
        <a href={href} target='_blank' rel='noopener noreferrer'>
            {text}
        </a>
    );
};
