import React, { FC } from 'react';
import { google } from 'base16';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
    wrapper: {
        display: 'flex',
        gap: '16px'
    },
    title: {
        margin: 0,
        marginBottom: '8px'
    },
    box: {
        width: '30px',
        height: '30px',
        border: '1px solid black',
        margin: 'auto'
    }
});

export const ThemePalette: FC = () => {
    const styles = useStyles();
    return (
        <section className={styles.wrapper}>
            {Object.entries(google).map(([key, color]) => (
                <div key={key}>
                    <h4 className={styles.title}>{key}</h4>
                    <div
                        className={styles.box}
                        style={{ backgroundColor: color }}
                    />
                </div>
            ))}
        </section>
    );
};
