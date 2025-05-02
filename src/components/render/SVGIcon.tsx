import React, { FC, memo } from 'react';
import DOMPurify from 'dompurify';

interface SVGIconProps {
    svgContent: string;
    className?: string;
    onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export const SVGIcon: FC<SVGIconProps> = memo(
    ({ svgContent, className, onClick }) => {
        const cleanSvg = DOMPurify.sanitize(svgContent, {
            USE_PROFILES: { svg: true, svgFilters: true }
        });

        return (
            <span
                className={className}
                dangerouslySetInnerHTML={{ __html: cleanSvg }}
                onClick={onClick}
            />
        );
    }
);
