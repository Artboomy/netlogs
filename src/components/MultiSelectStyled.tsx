import { MultiSelect } from 'react-multi-select-component';
import styled from '@emotion/styled';

export const MultiSelectStyled = styled(MultiSelect)(({ theme }) => ({
    marginLeft: 'auto',
    '--rmsc-h': '20px!important',
    fontSize: '10px',
    '--rmsc-p': '4px',
    width: '160px',
    '& .item-renderer': {
        alignItems: 'center!important',
        lineHeight: '10px'
    },
    '--rmsc-bg': theme.mainBg,
    '--rmsc-main': theme.mainFont,
    '--rmsc-border': theme.borderColor,
    '--rmsc-selected': theme.oddRowBg,
    '--rmsc-hover': theme.icon.hover
}));
