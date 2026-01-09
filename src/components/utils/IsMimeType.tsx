export type RawType =
    | Record<string, unknown>
    | string
    | null
    | undefined
    | number;
type WithMimeType = {
    __mimeType: string;
    __getRaw: () => RawType;
};
export const isMimeType = (data: unknown): data is WithMimeType => {
    return Boolean(data && typeof data === 'object' && '__mimeType' in data);
};
