import React, { FC, useEffect } from 'react';
import data from '../../demo/example.json';
import { NetworkRequest } from '../../models/types';
import NetworkItem from '../../models/NetworkItem';

import { ModalContainer } from '../modal/Container';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DropContainer } from './DropContainer';
import { ListContainer } from './Container';
import { useListStore } from '../../controllers/network';
import { createUseStyles } from 'react-jss';
import { action } from '@storybook/addon-actions';
const useStyles = createUseStyles({
    '@global': {
        html: {
            height: '100%'
        },
        body: {
            height: '100%',
            margin: 0
        },
        '#root': {
            height: '100%'
        }
    }
});
export const ListDemo: FC = () => {
    const { setList } = useListStore();
    useStyles();

    useEffect(() => {
        const demoList = (data.log.entries as unknown) as NetworkRequest[];
        setList(demoList.map((request) => new NetworkItem({ request })));
    }, []);

    return (
        <DndProvider backend={HTML5Backend}>
            <ModalContainer>
                <DropContainer>
                    <ListContainer onCountChange={action('onCountChange')} />
                </DropContainer>
            </ModalContainer>
        </DndProvider>
    );
};
