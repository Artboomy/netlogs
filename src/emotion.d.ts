import { Theme as BasicTheme } from 'theme/types';

import '@emotion/react';
import '@emotion/styled';

declare module '@emotion/react' {
    export interface Theme extends BasicTheme {}
}
