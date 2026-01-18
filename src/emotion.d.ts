import { Theme as BasicTheme } from 'theme/types';

import '@emotion/react';
import '@emotion/styled';

declare module '@emotion/react' {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    export interface Theme extends BasicTheme {}
}
