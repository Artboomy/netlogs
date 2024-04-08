import React, { Component, ErrorInfo, ReactNode } from 'react';
import { callParentVoid } from 'utils';
import { i18n } from 'translations/i18n';

type TState = { hasError: boolean; error: Error | null };
export default class ErrorBoundary extends Component<
    Record<string, unknown>,
    TState
> {
    constructor(props: Record<string, unknown>) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): TState {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error(error, errorInfo);
        callParentVoid(
            `analytics.error`,
            JSON.stringify({
                message: error.message,
                stack: errorInfo.componentStack
            })
        );
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            const error = this.state.error;
            return (
                <div>
                    <h1>{i18n.t('errorOccurred')}</h1>
                    <div>{error?.message}</div>
                    <pre>{error?.stack}</pre>
                </div>
            );
        }

        return this.props.children as ReactNode;
    }
}
