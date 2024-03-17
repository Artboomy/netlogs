import React, { FC, ReactElement } from 'react';
import { createUseStyles } from 'react-jss';
import { Empty } from './list/Empty';
import { mediaQuerySmallOnly } from '../utils';

const useStyles = createUseStyles({
    content: {
        display: 'grid',
        rowGap: '4px',
        // 45% leaves gap on the right on ultra-wide monitor
        gridTemplateColumns:
            'min-content 30ch minmax(auto, 46%) minmax(auto, 46%)',
        whiteSpace: 'pre-wrap',
        [mediaQuerySmallOnly]: {
            gridTemplateColumns: 'min-content auto',
            rowGap: 0
        }
    },
    oddRow: {
        backgroundColor: 'rgba(245, 245, 245)'
    }
});

export const List: FC<{ content: ReactElement[] }> = ({ content }) => {
    const styles = useStyles();
    return content.length ? (
        <div className={styles.content}>
            {content.map((i, idx) =>
                idx % 2
                    ? React.cloneElement(i, {
                          className: styles.oddRow
                      })
                    : i
            )}
        </div>
    ) : (
        <Empty />
    );
};
