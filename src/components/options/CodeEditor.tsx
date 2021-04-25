import React, { FC } from 'react';
import { Controlled as CodeMirror } from 'react-codemirror2';
import { Editor, EditorChange } from 'codemirror';

type Props = {
    onBeforeChange: (editor: Editor, data: EditorChange, value: string) => void;
    value: string;
    readOnly?: boolean;
};

export const CodeEditor: FC<Props> = ({ onBeforeChange, value, readOnly }) => {
    return (
        <CodeMirror
            options={{
                mode: 'javascript',
                lineNumbers: true,
                indentUnit: 4,
                readOnly,
                viewportMargin: Infinity
            }}
            onBeforeChange={onBeforeChange}
            value={value}
        />
    );
};
