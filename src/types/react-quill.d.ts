declare module 'react-quill' {
    import React from 'react';

    export interface ReactQuillProps {
        theme?: string;
        modules?: any;
        formats?: string[];
        value?: string;
        defaultValue?: string;
        placeholder?: string;
        readOnly?: boolean;
        onChange?: (content: string, delta: any, source: string, editor: any) => void;
        className?: string;
        style?: React.CSSProperties;
        ref?: React.Ref<any>;
    }

    export default class ReactQuill extends React.Component<ReactQuillProps> {
        getEditor(): any;
    }
}
