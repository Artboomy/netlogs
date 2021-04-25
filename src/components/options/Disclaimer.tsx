import React, { FC } from 'react';
import { createUseStyles } from 'react-jss';
import { google } from 'base16';

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
                <h3 className={styles.title}>Disclaimer</h3>
            </legend>
            <p className={styles.line}>
                Always carefully review the code you write on this page.
                especially when received from 3rd parties.
            </p>
            <p className={styles.line}>
                Do not paste untrusted code in any of the functions.
            </p>
        </fieldset>
    );
};
