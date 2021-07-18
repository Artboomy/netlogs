import { createContext, ReactNode } from 'react';

export const ModalContext = createContext<{
    value: null | ReactNode;
    setValue: (_newValue: ReactNode) => void;
}>({
    value: null,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setValue: (_newValue: ReactNode) => {
        /*pass*/
    }
});
