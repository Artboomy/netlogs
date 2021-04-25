import React, { FC, ReactElement } from 'react';
import { createUseStyles } from 'react-jss';
import { Empty } from './list/Empty';
import { mediaQuerySmallOnly } from '../utils';

const useStyles = createUseStyles({
    content: {
        display: 'grid',
        rowGap: '4px',
        gridTemplateColumns:
            'min-content 30ch minmax(auto, 45%) minmax(auto, 45%)',
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
