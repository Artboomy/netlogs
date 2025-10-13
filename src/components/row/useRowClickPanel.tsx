import React, {
    MouseEventHandler,
    useCallback,
    useContext,
    useEffect,
    useRef
} from 'react';
import { PropTree } from 'components/PropTree';
import ContentOnlyItem from 'models/ContentOnlyItem';
import { TransactionItemAbstract } from 'models/TransactionItem';
import { ModalContext } from 'components/modal/Context';

export const useRowClickPanel = (
    item: ContentOnlyItem | TransactionItemAbstract
) => {
    const { setValue } = useContext(ModalContext);
    const meta = item.getMeta();
    const shouldClean = useRef(false);
    const handleClick: MouseEventHandler = useCallback(() => {
        const selection = document.getSelection()?.toString() || '';
        if (selection === '') {
            if (meta) {
                setValue(<PropTree data={meta} />);
                shouldClean.current = true;
            }
        }
    }, [meta]);
    useEffect(() => {
        return () => {
            if (shouldClean.current) {
                setValue(null);
                shouldClean.current = false;
            }
        };
    }, []);
    return handleClick;
};
