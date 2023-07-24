import React, { useState, useEffect, useMemo } from 'react';
import AudioButton from './AudioButton';

const DirectText = ({ word, translationFrom, trainedWords, listening, onQuestionChange }) => {
    console.log('render DirectText');

    const [answer, setAnswer] = useState('');
    const [checkingAnswer, setCheckingAnswer] = useState(false);
    const [message, setMessage] = useState('');
    const [messageAdditional, setMessageAdditional] = useState('');
    // const ref = useRef(null);
    // const ref2 = useRef(null);

    const wordFrom = useMemo(
        () => translationFrom ? 
            word : word.translations[ 
                Math.floor( Math.random() * word.translations.length ) ],
            [word]);

    function handleKeyboard(e) {
        if ((e.key == 'Enter') && (answer))
            if (!checkingAnswer)
                checkAnswer();
            else
                nextQuestion()
    }
        
    // useEffect(() => {

    // }, []); // runs only on mount
    useEffect(() => {

        // ref.current && ref.current.focus();

        document.getElementById('answer').focus();

        document.addEventListener("keydown", handleKeyboard);
        return () => document.removeEventListener("keydown", handleKeyboard);
        // function handleAction(e) {
        //     if (e.key == 'Enter')
        //         if (checkingAnswer)
        //             nextQuestion();
        //         else
        //             checkAnswer();
        // }
        // window.addEventListener('keydown', handleAction);
        // return () => window.removeEventListener('scroll', handleScroll);

    }); // runs after every re-render
    // useEffect(() => {
    //     if (!checkingAnswer)
    //         ref.current && ref.current.focus();
    //     // else  // doesn't work as expected
    //     //     ref2.current && ref2.current.focus();
    // }); // runs after every re-render

    // function onEnter(e) {
    //     if (e.key == 'Enter' && e.target.value)
    //         checkAnswer();
    // }

    function checkAnswer () {

        setCheckingAnswer(true);

        var correctTranslations = [];

        if (translationFrom)
            word.translations.forEach(w => correctTranslations.push(w['word_text']));
        else 
            correctTranslations.push(word['word_text']);

        if (correctTranslations.includes(answer)) {
            word.correct += 1;
            setMessage('correct');
        }
        else {
            word.mistakes += 1;
            setMessage('incorrect');
        }

        trainedWords.push(word);
        
        setMessageAdditional(correctTranslations.join(' OR '));
    }

    function nextQuestion () {

        setAnswer('');
        setMessage('');
        setMessageAdditional('');
        setCheckingAnswer(false);

        onQuestionChange();
    }

    return (<>
        { wordFrom.pronunciation ? <AudioButton pronunciation={ wordFrom.pronunciation } /> : <></> }
        <label>{ wordFrom['word_text'] }</label>
        <input id="answer" type="text" autoComplete="off" value={ answer } 
            onChange={ (e) => setAnswer(e.target.value) }
            // onKeyDown={ (e) => onEnter(e) }
            disabled={ checkingAnswer } />

        { checkingAnswer ? 
            <input id='nxt' type="button" value="Next" onClick={ nextQuestion } /> : 
            <input type="button" value="Check answer" onClick={ checkAnswer } disabled={ answer ? false : true } />}

        <p className={ message }>{ message }</p>
        <p className={ message }>{ messageAdditional }</p>
    </>);
}

export default DirectText
