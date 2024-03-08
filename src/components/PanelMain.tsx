import React, { useEffect, useState } from 'react';
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
import { useHotkey } from '../hooks/useHotkey';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import { callParentVoid } from '../utils';

const useStyles = createUseStyles({
    '@global': {
        html: {
            height: '100%',
            backgroundColor: 'white',
            fontFamily: '"Segoe UI", Tahoma, sans-serif',
            fontSize: '13px'
        },
        body: {
            height: '100%',
            margin: 0,
            fontSize: '100%'
        },
        '#root': {
            height: '100%'
        },
        kbd: {
            backgroundColor: '#eee',
            borderRadius: '3px',
            border: '1px solid #b4b4b4',
            boxShadow:
                '0 1px 1px rgba(0, 0, 0, .2), 0 2px 0 0 rgba(255, 255, 255, .7) inset',
            color: '#333',
            display: 'inline-block',
            fontWeight: 700,
            lineHeight: 1,
            padding: '2px 4px',
            whiteSpace: 'nowrap'
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
    const [count, setCount] = useState<{
        visibleCount: number;
        totalCount: number;
    }>({ visibleCount: 0, totalCount: 0 });
    useHotkey('toggleHideUnrelated', () => setHideUnrelated(!hideUnrelated), [
        hideUnrelated
    ]);

    useEffect(() => {
        callParentVoid('analytics.init');
    }, []);
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
                                        <ListContainer
                                            onCountChange={setCount}
                                        />
                                    </DropContainer>
                                </ErrorBoundary>
                                <Footer
                                    value={filterValue}
                                    onValueChange={setFilterValue}
                                    totalCount={count.totalCount}
                                    visibleCount={count.visibleCount}
                                />
                            </FilterContext.Provider>
                        </SearchContext.Provider>
                        <ToastContainer />
                    </div>
                </ModalContainer>
            </SettingsContainer>
        </DndProvider>
    );
};
