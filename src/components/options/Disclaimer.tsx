import React, { FC } from 'react';
import { createUseStyles } from 'react-jss';
import { i18n } from 'translations/i18n';

const useStyles = createUseStyles({
    root: {
        border: `3px solid red`,
        backgroundColor: 'rgba(255,0,0,0.2)'
    },
    title: {
        margin: 0
    },
    line: {
        margin: '4px'
    }
});
export const Disclaimer: FC = () => {
    const styles = useStyles();
    return (
        <fieldset className={styles.root}>
            <legend>
                <h3 className={styles.title}>{i18n.t('disclaimer')}</h3>
            </legend>
            <p className={styles.line}>{i18n.t('disclaimerReview')}</p>
            <p className={styles.line}>{i18n.t('disclaimerNoUntrusted')}</p>
        </fieldset>
    );
};
