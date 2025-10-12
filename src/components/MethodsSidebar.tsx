import React, {
    ChangeEventHandler,
    useCallback,
    useMemo,
    useRef,
    useState
} from 'react';
import { useSettings } from 'hooks/useSettings';
import styled from '@emotion/styled';
import { useListStore } from 'controllers/network';
import { isTransactionItem } from 'models/utils';
import { NodeRendererProps, Tree } from 'react-arborist';
import { useDragDropManager } from 'react-dnd';
import { useShallow } from 'zustand/react/shallow';
import ContentOnlyItem from 'models/ContentOnlyItem';
import HostController from 'controllers/host';
import ErrorBoundary from 'components/ErrorBoundary';
import { partialHighlight } from 'react-inspector';
import { useAnalyticsDuration } from 'utils';
import { i18n } from 'translations/i18n';
import { Tooltip } from 'components/Tooltip';
const StyledTree = styled(Tree)({
    paddingTop: '4px'
}) as typeof Tree;

const Root = styled.div(({ theme }) => ({
    position: 'absolute',
    backgroundColor: theme.panelColor,
    top: '30px',
    bottom: '28px',
    right: '0px',
    width: '300px',
    overflow: 'auto',
    padding: '4px',
    borderLeft: `1px solid ${theme.borderColor}`
}));

const Collapser = styled.span({
    width: '12px',
    cursor: 'pointer'
});

const RenderName = styled.span({
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    maxWidth: '150px',
    overflow: 'hidden',
    cursor: 'pointer',
    flex: 1
});

type TreeName = string;
type TreeMap = {
    id: string;
    name: TreeName;
    value: boolean;
    children?: Record<string, TreeMap>;
    // parent?: TreeMap;
};

function buildMap(list: import('controllers/network').ItemList): TreeMap {
    const map: TreeMap = {
        id: 'root',
        name: 'root',
        value: true,
        children: {}
    };
    for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (isTransactionItem(item)) {
            if (item.getTag() === 'RPC' || item.getTag() == 'GQL') {
                const name = item.getName();
                const [namespace, method] = name.split('.');
                if (namespace && method && map.children) {
                    if (!map.children[namespace]) {
                        map.children[namespace] = {
                            id: namespace,
                            name: namespace,
                            value: true,
                            children: {}
                        };
                    }
                    map.children[namespace].children = {
                        ...map.children[namespace].children,
                        [method]: {
                            id: name,
                            name: method,
                            value: true
                            // parent: map.children[namespace]
                        }
                    };
                }
            } else {
                const nameParts: string[] = [];
                const n = item.getName();
                if (n === '/') {
                    continue;
                }
                let current = '';
                for (let i = 0; i < n.length; i++) {
                    if (n[i] === '/') {
                        if (i === 0) {
                            current += n[i];
                            continue;
                        } else {
                            nameParts.push(current);
                            current = '';
                        }
                    }
                    current += n[i];
                }
                if (current) {
                    nameParts.push(current);
                }
                let idx = 0;
                let root = map;
                let currentPart = nameParts[idx];
                let path = currentPart;
                while (currentPart) {
                    if (!root.children) {
                        root.children = {};
                    }
                    if (!root.children[currentPart]) {
                        root.children[currentPart] = {
                            id: path,
                            name: currentPart,
                            value: true
                            // parent: root
                        };
                    }
                    if (idx !== nameParts.length - 1) {
                        root = root.children[currentPart];
                    }
                    idx += 1;
                    currentPart = nameParts[idx];
                    path = path + currentPart;
                }
            }
        }
    }
    return map;
}

const Row = (props: NodeRendererProps<TreeMap>) => {
    const host = HostController.host;
    const { node, style } = props;
    const { checked, parentUnchecked } = useSettings(
        useShallow(({ settings: { methodChecks } }) => {
            const ourMethodChecks = methodChecks[host];
            if (!ourMethodChecks) {
                return { checked: true, parentUnchecked: false };
            }
            const parentUnchecked = Object.entries(ourMethodChecks)
                .filter(([_, v]) => v === false)
                .some(([k]) => {
                    return k !== node.id && node.id.startsWith(k);
                });
            if (parentUnchecked) {
                return { checked: false, parentUnchecked: true };
            }
            return {
                checked:
                    ourMethodChecks[node.id] === undefined
                        ? true
                        : !!ourMethodChecks[node.id],
                parentUnchecked: false
            };
        })
    );
    const allChecked = true;
    const someUnchecked = false;

    const checkboxRef = useRef<HTMLInputElement | null>(null);
    const indeterminate = !allChecked && someUnchecked;
    if (checkboxRef.current) {
        checkboxRef.current.indeterminate = indeterminate;
    }

    const onToggle = useCallback(() => {
        const host = HostController.host;
        const prevChecks = useSettings.getState().settings.methodChecks;
        useSettings.getState().patchSettings({
            methodChecks: {
                ...prevChecks,
                [host]: {
                    ...(prevChecks[host] || {}),
                    [node.data.id]:
                        prevChecks[host]?.[node.data.id] === undefined
                            ? false
                            : !prevChecks[host]?.[node.data.id]
                }
            }
        });
    }, []);

    const renderName = node.data.name.startsWith('/')
        ? node.data.name.slice(1)
        : node.data.name;
    const searchTerm = props.tree.props.searchTerm;
    return (
        <div
            style={{ ...style, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Collapser onClick={() => node.toggle()}>
                {Object.keys(node.data.children || {})?.length
                    ? node.isOpen
                        ? '▼'
                        : '▶'
                    : '|'}
            </Collapser>
            <input
                disabled={parentUnchecked}
                ref={checkboxRef}
                type='checkbox'
                checked={checked}
                onChange={onToggle}
                title={indeterminate ? 'Partially selected' : ''}
            />
            <Tooltip overlay={renderName} placement='bottom'>
                <RenderName onClick={() => node.toggle()}>
                    {searchTerm
                        ? partialHighlight(renderName, searchTerm, {
                              style: null
                          })
                        : renderName}
                </RenderName>
            </Tooltip>
        </div>
    );
};

export const MethodsSidebar = () => {
    useAnalyticsDuration('analytics.methodsSidebarViewed');
    const methodsSidebarVisible = useSettings(
        (state) => state.settings.methodsSidebarVisible
    );
    const [searchTerm, setSearchTerm] = useState('');

    // build the raw list excluding ContentOnlyItem
    const rawList = useListStore(
        useShallow((state) => {
            const hiddenTags = useSettings.getState().settings.hiddenTags;
            const hiddenMimeTypesArray =
                useSettings.getState().settings.hiddenMimeTypes;
            return state.list.filter((i) => {
                if (i instanceof ContentOnlyItem) {
                    return false;
                }
                return (
                    !hiddenTags[i.getTag()] &&
                    !hiddenMimeTypesArray.includes(
                        i.toJSON().response?.content.mimeType
                    ) &&
                    i.shouldShow()
                );
            });
        })
    );

    const data = useMemo(() => {
        const map = buildMap(rawList);
        return Object.values(map.children || {});
    }, [rawList]);

    const dndManager = useDragDropManager();

    const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
        setSearchTerm(e.target.value);
    };
    if (!methodsSidebarVisible) {
        return null;
    }
    return (
        <Root>
            <ErrorBoundary>
                <input
                    style={{ paddingBottom: '4px' }}
                    id='methodSearch'
                    type='text'
                    placeholder={i18n.t('search')}
                    value={searchTerm}
                    onChange={handleChange}
                />
                <StyledTree<TreeMap>
                    searchTerm={searchTerm}
                    data={data}
                    width={300 - 8}
                    height={Math.max(
                        100,
                        window.innerHeight - 31 - 28 - 24 - 8 - 4
                    )}
                    openByDefault
                    rowHeight={22}
                    indent={14}
                    dndManager={dndManager}
                    childrenAccessor={(d) =>
                        d.children ? Object.values(d.children) : []
                    }>
                    {Row}
                </StyledTree>
            </ErrorBoundary>
        </Root>
    );
};
