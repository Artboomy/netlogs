import React, { useState, useEffect, memo } from 'react';
import { google } from 'base16';
import styled from '@emotion/styled';
import { base16Darcula } from 'theme/dark';

const DurationValue = styled.span<{ color: string }>(({ color }) => ({
    color
}));

const Suffix = styled.span(({ theme }) => ({
    fontSize: '0.8em',
    color: theme.icon.normal
}));

interface PendingDurationProps {
    startTimestamp: number;
}

/**
 * Animated duration display for pending requests.
 * Updates every 50ms to show elapsed time since request started.
 * Uses local state to prevent parent re-renders.
 */
export const PendingDuration: React.FC<PendingDurationProps> = memo(
    ({ startTimestamp }) => {
        const [elapsed, setElapsed] = useState(() => Date.now() - startTimestamp);

        useEffect(() => {
            const interval = setInterval(() => {
                setElapsed(Date.now() - startTimestamp);
            }, 50);

            return () => clearInterval(interval);
        }, [startTimestamp]);

        // Color coding based on duration
        let color = google.base0B; // green
        if (elapsed > 1000) {
            color = base16Darcula.base0F; // red
        } else if (elapsed > 500) {
            color = base16Darcula.base0E; // orange
        } else if (elapsed > 300) {
            color = google.base0A; // yellow
        }

        return (
            <>
                <DurationValue color={color}>{elapsed.toFixed(0)}</DurationValue>
                <Suffix> ms</Suffix>
            </>
        );
    }
);

PendingDuration.displayName = 'PendingDuration';
