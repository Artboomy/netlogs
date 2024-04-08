declare module '*.svg' {
    // eslint-disable-next-line
    const content: any;
    export default content;
}

// else import.meta.env is undefined
import 'vite/client';
