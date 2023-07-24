import React, { useState, useEffect } from 'react';
import PracticePane from './PracticePane';

const baseUrl = 'http://localhost:8000';
const reactUrl = baseUrl + '/dictionary/react/';
const filesDir = baseUrl + '/dictionary/files/';

const PracticeApp = () => {
    console.log('render PracticeApp');

    const [session, setSession] = useState('');
    const [words, setWords] = useState([]);
    const [err, setErr] = useState('');
    const [otherWordsFrom, setOtherWordsFrom] = useState([]);
    const [otherWordsTo, setOtherWordsTo] = useState([]);

    const fetchData = () => {
        fetch(reactUrl)
            .then(response => {
                return response.json();
            })
            .then(data => {
                
                if (data['error']) {
                    setErr(data['error']);
                } else {
                    setSession(data['session']);
                    setWords(data['words']);
                    console.log(data['session']);
                    console.log(data['words']);
                    
                    if ( data.session['translation_direction'] == 'from' )
                        setOtherWordsFrom(data['other_words_from']);
                    else if (data.session['translation_direction'] == 'to')
                        setOtherWordsTo(data['other_words_to']);
                    else    // 'mixed'
                        setOtherWordsFrom(data['other_words_from']);
                        setOtherWordsTo(data['other_words_to']);
                }
            })
            .catch((error) => {
                console.log(error)
            });
    };

    useEffect(() => {
        fetchData()
    }, []);

    return (<>
        <div>
            { err ? <p style={{color: 'red'}}><strong> { err } </strong></p> : <></> }
        </div>
        { words.length > 0 ? 
            <PracticePane session={session} words={words} 
                otherWordsFrom={ otherWordsFrom }
                otherWordsTo={ otherWordsTo } /> : <></> }
    </>);
}

export {
    baseUrl,
    reactUrl,
    filesDir,
    PracticeApp as default
}
