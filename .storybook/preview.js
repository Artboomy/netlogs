import React from 'react';
import { ModalContainer } from '../src/components/modal/Container';

export const parameters = {
    actions: { argTypesRegex: '^on[A-Z].*' }
};
export const decorators = [
    (Story) => (
        <ModalContainer>
            <Story />
        </ModalContainer>
    )
];
