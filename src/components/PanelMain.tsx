import React, { useState } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { Header } from './Header';
import { createUseStyles } from 'react-jss';
import { SettingsContainer } from './SettingsContainer';
import { ModalContainer } from './modal/Container';
import { ListContainer } from './list/Container';
import { SearchContext } from 'react-inspector';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DropContainer } from './list/DropContainer';
import useDebounce from 'react-use/lib/useDebounce';
import { Footer } from './Footer';
import { FilterContext } from '../context/FilterContext';

const useStyles = createUseStyles({
    '@global': {
        html: {
            height: '100%',
            backgroundColor: 'white'
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
        flexDirection: 'column',
        overflow: 'auto'
    },
    header: {
        position: 'sticky',
        top: 0
    }
});
export const PanelMain: React.FC = () => {
    const styles = useStyles();
    const [searchValue, setSearchValue] = useState('');
    const [hideUnrelated, setHideUnrelated] = useState(true);
    const [caseSensitive, setCaseSensitive] = useState(false);
    const [debSearchValue, setDebSearchValue] = useState('');
    useDebounce(() => setDebSearchValue(searchValue), 100, [searchValue]);
    const [filterValue, setFilterValue] = useState('');
    const [debFilterValue, setDebFilterValue] = useState('');
    useDebounce(() => setDebFilterValue(filterValue), 100, [filterValue]);
    return (
        <DndProvider backend={HTML5Backend}>
            <SettingsContainer>
                <ModalContainer>
                    <div className={styles.root}>
                        <SearchContext.Provider
                            value={{
                                value: debSearchValue,
                                hideUnrelated,
                                caseSensitive
                            }}>
                            <Header
                                className={styles.header}
                                searchValue={searchValue}
                                hideUnrelated={hideUnrelated}
                                onSearchChange={setSearchValue}
                                onHideUnrelatedChange={setHideUnrelated}
                                caseSensitive={caseSensitive}
                                onCaseSensitiveChange={setCaseSensitive}
                            />
                            <FilterContext.Provider value={debFilterValue}>
                                <ErrorBoundary>
                                    <DropContainer>
                                        <ListContainer />
                                    </DropContainer>
                                </ErrorBoundary>
                                <Footer
                                    value={filterValue}
                                    onValueChange={setFilterValue}
                                />
                            </FilterContext.Provider>
                        </SearchContext.Provider>
                    </div>
                </ModalContainer>
            </SettingsContainer>
        </DndProvider>
    );
};
