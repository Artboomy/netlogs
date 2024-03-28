import React, { FC, useEffect } from 'react';
import { wrapSandbox } from 'sandboxUtils';
import { createUseStyles } from 'react-jss';
import { i18n } from 'translations/i18n';

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
            <h3>{i18n.t('demo')}</h3>
            <p>
                <i>{i18n.t('demoHelp1')}</i>
            </p>
            <p>
                <i>{i18n.t('demoHelp2')}</i>
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
