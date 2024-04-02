import React, { useEffect, useState } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { Header } from './Header';
import { createUseStyles } from 'react-jss';
import { ModalContainer } from './modal/Container';
import { ListContainer } from './list/Container';
import { SearchContext } from 'react-inspector';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DropContainer } from './list/DropContainer';
import useDebounce from 'react-use/lib/useDebounce';
import { Footer } from './Footer';
import { FilterContext } from 'context/FilterContext';
import { useHotkey } from 'hooks/useHotkey';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import { callParent, callParentVoid, subscribeParent } from 'utils';
import { Theme } from 'theme/types';
import { useSettings } from 'hooks/useSettings';

const useStyles = createUseStyles<Theme>((theme) => ({
    '@global': {
        html: {
            height: '100%',
            backgroundColor: theme.mainBg,
            fontFamily: '"Segoe UI", Tahoma, sans-serif',
            fontSize: '13px',
            color: theme.mainFont,
            colorScheme: theme.name
        },
        ...(theme.linkColor && {
            a: {
                color: theme.linkColor,
                textDecorationColor: theme.linkColor
            },
            'a:visited': {
                color: theme.linkVisitedColor,
                textDecorationColor: theme.linkVisitedColor
            }
        }),
        body: {
            height: '100%',
            margin: 0,
            fontSize: '100%'
        },
        '#root': {
            height: '100%'
        },
        kbd: {
            backgroundColor: theme.mainBg,
            borderRadius: '3px',
            border: `1px solid ${theme.borderColor}`,
            boxShadow: `0 1px 1px rgba(0, 0, 0, .2), 0 2px 0 0 rgba(255, 255, 255, .${
                theme.name === 'light' ? '7' : '3'
            }) inset`,
            color: theme.mainFont,
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
}));
export const PanelMain: React.FC = () => {
    const styles = useStyles();
    const [{ language }] = useSettings();
    const [searchValue, setSearchValue] = useState('');
    const [hideUnrelated, setHideUnrelated] = useState(true);
    const [caseSensitive, setCaseSensitive] = useState(false);
    const [debSearchValue, setDebSearchValue] = useState('');
    useDebounce(() => setDebSearchValue(searchValue), 100, [searchValue]);
    const [filterValue, setFilterValue] = useState('');
    const [debFilterValue, setDebFilterValue] = useState('');
    useDebounce(() => setDebFilterValue(filterValue), 100, [filterValue]);
    useHotkey('toggleHideUnrelated', () => setHideUnrelated(!hideUnrelated), [
        hideUnrelated
    ]);
    /*const useOnce = useRef(true);
    useEffect(() => {
        if (useOnce.current) {
            useOnce.current = false;
            return;
        }
        toast.info(i18n.t('langChange'));
    }, [language]);
*/
    useEffect(() => {
        callParent('analytics.init').then((isDefault) => {
            if (isDefault !== 'true') {
                toast.warning(
                    'Custom profiles support is DEPRECATED and will be REMOVED in the next version',
                    {
                        autoClose: false
                    }
                );
            }
        });
    }, []);

    useEffect(() => {
        subscribeParent('searchOnPage', (str) => {
            setSearchValue(str);
            callParentVoid('analytics.searchOnPage');
        });
    }, []);
    return (
        <DndProvider backend={HTML5Backend} key={language}>
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
                    <ToastContainer />
                </div>
            </ModalContainer>
        </DndProvider>
    );
};
