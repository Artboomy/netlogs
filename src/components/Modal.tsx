import React, { FC, ReactNode } from 'react';
import { mediaQuerySmallOnly } from 'utils';
import { IconButton, ICONS } from './IconButton';
import { i18n } from 'translations/i18n';
import styled from '@emotion/styled';

const Container = styled.div(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: '50%',
    right: 0,
    top: 0,
    bottom: 0,
    // NOTE: should be larger than codemirror z-index
    zIndex: 10,
    backgroundColor: theme.mainBg,
    paddingLeft: '8px',
    borderLeft: `1px solid ${theme.borderColor}`,
    [mediaQuerySmallOnly]: {
        left: '60px'
    }
}));

const Header = styled.div(({ theme }) => ({
    padding: '2px',
    borderBottom: `1px solid ${theme.borderColor}`
}));

const Wrapper = styled.div({
    overflow: 'auto',
    overflowWrap: 'break-word'
});

type ModalProps = {
    children: ReactNode;
    onClose: () => void;
};

export const Modal: FC<ModalProps> = ({ children, onClose }) => {
    return (
        <Container>
            <Header>
                <IconButton
                    icon={ICONS.cross}
                    onClick={onClose}
                    title={i18n.t('close')}
                />
            </Header>
            <Wrapper>{children}</Wrapper>
        </Container>
    );
};
