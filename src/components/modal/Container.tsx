import { ModalContext } from './Context';
import React, { FC, ReactNode, useState } from 'react';
import { Modal } from '../Modal';

export const ModalContainer: FC = ({ children }) => {
    const [value, setValue] = useState<ReactNode>(null);
    return (
        <ModalContext.Provider value={{ value: null, setValue }}>
            {children}
            {value && <Modal onClose={() => setValue(null)}>{value}</Modal>}
        </ModalContext.Provider>
    );
};
