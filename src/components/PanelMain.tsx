import React, { useState } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { Header } from './Header';
import { createUseStyles } from 'react-jss';
import { SettingsContainer } from './SettingsContainer';
import { ModalContainer } from './modal/Container';
import { ListContainer } from './list/Container';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { HighlightContext } from 'react-inspector';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DropContainer } from './list/DropContainer';

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
    },
    root: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
    },
    header: {
        position: 'sticky',
        top: 0
    }
});
export const PanelMain: React.FC = () => {
    const styles = useStyles();
    const [searchValue, setSearchValue] = useState('');
    return (
        <DndProvider backend={HTML5Backend}>
            <SettingsContainer>
                <ModalContainer>
                    <div className={styles.root}>
                        <HighlightContext.Provider value={searchValue}>
                            <Header
                                className={styles.header}
                                searchValue={searchValue}
                                onSearchChange={setSearchValue}
                            />
                            <ErrorBoundary>
                                <DropContainer>
                                    <ListContainer />
                                </DropContainer>
                            </ErrorBoundary>
                        </HighlightContext.Provider>
                    </div>
                </ModalContainer>
            </SettingsContainer>
        </DndProvider>
    );
};
