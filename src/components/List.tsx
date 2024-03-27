import React, { FC } from 'react';
import { createUseStyles } from 'react-jss';
import { Empty } from './list/Empty';
import { mediaQuerySmallOnly } from 'utils';
import { ItemList } from 'controllers/network';
import { Row } from './Row';

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
    }
});

export const List: FC<{ items: ItemList }> = ({ items }) => {
    const styles = useStyles();
    if (!items.length) {
        return <Empty />;
    }
    return (
        <div className={styles.content}>
            {items.map((networkItem, idx) => (
                <Row key={networkItem.id} item={networkItem} idx={idx} />
            ))}
        </div>
    );
};
