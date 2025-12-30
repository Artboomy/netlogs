import { createContext, ReactNode } from 'react';

export const ModalContext = createContext<{
    value: null | ReactNode;
    setValue: (_newValue: ReactNode) => void;
}>({
    value: null,
    setValue: (_newValue: ReactNode) => {
        /*pass*/
    }
});
