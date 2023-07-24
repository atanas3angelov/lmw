import React, { useState, useEffect, useMemo } from 'react';
import AudioButton from './AudioButton';

const DirectText = ({ word, translationFrom, trainedWords, listening, onQuestionChange }) => {
    console.log('render DirectText');

    const [answer, setAnswer] = useState('');
    const [checkingAnswer, setCheckingAnswer] = useState(false);
    const [message, setMessage] = useState('');
    const [messageAdditional, setMessageAdditional] = useState('');

    const wordFrom = useMemo(
        () => translationFrom ? 
            word : word.translations[ 
                Math.floor( Math.random() * word.translations.length ) ],
            [word]);

    function handleKeyboard(e) {

        if(e.key == 0 && wordFrom['pronunciation']) {
            document.getElementById(wordFrom['pronunciation'].split('.')[0]).play();
        }

        if((e.key == 'Enter') && (answer))
            if (!checkingAnswer)
                checkAnswer();
            else
                nextQuestion()
    }

    function handleAfterAudioPlayed() {
        document.getElementById('answer').focus();
    }
    
    function answerChanged(e) {

        if(e.target.value.slice(-1) == '0') {
            e.target.value = e.target.value.slice(0, -1);
        }
        else {
            setAnswer(e.target.value);
        }
    }

    useEffect(() => {

        document.getElementById('answer').focus();

        document.addEventListener("keydown", handleKeyboard);
        return () => document.removeEventListener("keydown", handleKeyboard);

    }); // runs after every re-render

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
        { wordFrom.pronunciation ? <AudioButton pronunciation={ wordFrom.pronunciation } onPressed={ handleAfterAudioPlayed } /> : <></> }
        <label>
            { listening && translationFrom && !checkingAnswer ? 
                /* only hide the word if translating from unknown language and not checking the answer */
                '-'.repeat(wordFrom['word_text'].length) : 
                wordFrom['word_text'] }
        </label>
        <input id="answer" type="text" autoComplete="off" value={ answer } 
            onChange={ answerChanged }
            disabled={ checkingAnswer } />

        { checkingAnswer ? 
            <input id='nxt' type="button" value="Next" onClick={ nextQuestion } /> : 
            <input type="button" value="Check answer" onClick={ checkAnswer } disabled={ answer ? false : true } />}

        <p className={ message }>{ message }</p>
        <p className={ message }>{ messageAdditional }</p>
    </>);
}

export default DirectText
