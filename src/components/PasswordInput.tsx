import React, { FC, useState } from 'react';
import styled from '@emotion/styled';

const InputWithButton = styled.div({
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
    width: '100%'
});

const Input = styled.input(({ theme }) => ({
    backgroundColor: theme.mainBg,
    color: theme.mainFont,
    border: `1px solid ${theme.borderColor}`,
    '&:focus': {
        borderColor: theme.accent,
        outline: 'none'
    },
    width: '100%',
    height: '21px',
    boxSizing: 'border-box'
}));

const ToggleButton = styled.button(({ theme }) => ({
    cursor: 'pointer',
    backgroundColor: theme.panelColor,
    color: theme.mainFont,
    border: `1px solid ${theme.borderColor}`,
    borderRadius: '2px',
    fontSize: '16px',
    lineHeight: '1',
    minWidth: '32px',
    flexShrink: 0,
    '&:hover': {
        backgroundColor: theme.rowHover
    }
}));

interface PasswordInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    id?: string;
    className?: string;
}

export const PasswordInput: FC<PasswordInputProps> = ({
    value,
    onChange,
    placeholder,
    id,
    className
}) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <InputWithButton className={className}>
            <Input
                id={id}
                type={showPassword ? 'text' : 'password'}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            <ToggleButton
                type='button'
                onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? '👁️' : '👁️‍🗨️'}
            </ToggleButton>
        </InputWithButton>
    );
};
