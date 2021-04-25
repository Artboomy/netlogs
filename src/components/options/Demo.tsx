import React, { FC, useEffect } from 'react';
import { wrapSandbox } from '../../sandboxUtils';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
    demoWrapper: {
        border: '1px solid #ccc'
    },
    sandbox: {
        border: 'none',
        width: '100%',
        height: '30vh'
    }
});
export const Demo: FC = () => {
    const styles = useStyles();

    useEffect(() => {
        wrapSandbox();
    }, []);

    return (
        <section>
            <h3>Interactive demo</h3>
            <p>
                <i>Try changing the profile and hit save</i>
            </p>
            <p>
                <i>You can drop your own log to experiment</i>
            </p>
            <div className={styles.demoWrapper}>
                <iframe
                    id='sandbox'
                    src='sandboxSettings.html'
                    className={styles.sandbox}
                />
            </div>
        </section>
    );
};
