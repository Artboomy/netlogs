import { useTheme } from '@emotion/react';
import RcTooltip from 'rc-tooltip';
import { FC, ReactElement } from 'react';
import { TooltipProps } from 'rc-tooltip/lib/Tooltip';

export const Tooltip: FC<
    TooltipProps & {
        children: ReactElement;
    }
> = ({ children, ...rest }) => {
    const theme = useTheme();
    const styles = {
        body: {
            padding: '2px 4px',
            minHeight: 0,
            backgroundColor: theme.mainBg,
            color: theme.mainFont
        }
    };
    return (
        <RcTooltip {...rest} styles={styles} mouseEnterDelay={0.1}>
            {children}
        </RcTooltip>
    );
};
