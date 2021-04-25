import React, { FC } from 'react';
import { Disclaimer } from './Disclaimer';
import { createUseStyles } from 'react-jss';
const useStyles = createUseStyles({
    howToList: {
        lineHeight: '1.5'
    },
    functionName: {
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '0 8px',
        margin: '0 4px',
        backgroundColor: '#eeeeee80'
    }
});

export const Instructions: FC = () => {
    const styles = useStyles();
    return (
        <section>
            <h3>How it works</h3>
            <ol className={styles.howToList}>
                <li>
                    <a href='#matcher'>
                        <code className={styles.functionName}>Matcher</code>
                    </a>{' '}
                    function is invoked on each request
                </li>
                <li>Returned profile name is used to resolve function set</li>
                <li>
                    <a href='#shouldShow'>
                        <code className={styles.functionName}>shouldShow</code>
                    </a>{' '}
                    is invoked to determine if request will render
                </li>
                <li>
                    <a href='#getName'>
                        <code className={styles.functionName}>getName</code>
                    </a>{' '}
                    invoked to show request `name` in second column
                </li>
                <li>
                    <a href='#getTag'>
                        <code className={styles.functionName}>getTag</code>
                    </a>{' '}
                    shows small text in colored balloon.
                </li>
                <li>
                    color of tag balloon can be painted red by{' '}
                    <a href='#isError'>
                        <code className={styles.functionName}>isError</code>
                    </a>
                </li>
                <li>
                    <a href='#getParams'>
                        <code className={styles.functionName}>getParams</code>
                    </a>{' '}
                    will determine third column content, aka input data
                </li>
                <li>
                    <a href='#getResult'>
                        <code className={styles.functionName}>getResult</code>
                    </a>{' '}
                    will determine last column content, aka output data
                </li>
                <li>
                    <a href='#getMeta'>
                        <code className={styles.functionName}>getMeta</code>
                    </a>{' '}
                    result is used to render extra data, visible on date column
                    click
                </li>
            </ol>
            <p>
                <code className={styles.functionName}>request</code> in function
                params is single{' '}
                <a
                    href='http://www.softwareishard.com/blog/har-12-spec/#entries'
                    target='_blank'
                    rel='noreferrer'>
                    HAR entry
                </a>
            </p>
            <Disclaimer />
        </section>
    );
};
