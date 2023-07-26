import React, { useState, useEffect, useMemo } from 'react';
import AudioButton from './AudioButton';

const DirectText = ({ word, translationFrom, trainedWords, listening, practiceNounGender, redo, onQuestionChange }) => {
    console.log('render DirectText');

    const [answer, setAnswer] = useState('');
    const [answerGender, setAnswerGender] = useState('');
    const [checkingAnswer, setCheckingAnswer] = useState(false);
    const [message, setMessage] = useState('');
    const [messageAdditional, setMessageAdditional] = useState('');
    const [highlighted, setHighlighted] = useState('');

    const wordFrom = useMemo(
        () => translationFrom ? 
            word : word.translations[ 
                Math.floor( Math.random() * word.translations.length ) ],
            [word]);

    function handleKeyboard(e) {

        // document events while the input for answer is in focus -> remember to delete the reserved keys from there!
        if (e.key == 0 && wordFrom['pronunciation']) {
            document.getElementById(wordFrom['pronunciation'].split('.')[0]).play();
        }

        if (!checkingAnswer) {
            if (e.key == 1) {
                setAnswerGender('m');
            }
            if (e.key == 2) {
                setAnswerGender('f');
            }
            if (e.key == 3) {
                setAnswerGender('n');
            }
        }

        if (e.key == 'Enter') {

            if (practiceNounGender && translationFrom) {

                if (answer && answerGender) {

                    if (!checkingAnswer)
                        checkAnswer();
                    else
                        nextQuestion();
                }
                // without answer and answerGender, nothing happens on Enter
            }
            else {
                if (answer) {

                    if (!checkingAnswer)
                        checkAnswer();
                    else
                        nextQuestion();
                }
                // without answer, nothing happens on Enter
            }
        }
    }

    function handleAfterAudioPlayed() {

        document.getElementById('answer').focus();
    }
    
    function isCheckAnswerButtonDisabled() {

        if (practiceNounGender && translationFrom)
            return answer && answerGender ? false : true;
        else
            return answer ? false : true;
    }

    function answerChanged(e) {

        // delete reserved keys for document events
        if (e.target.value.slice(-1) == '0') {      // reserved for playing audio, if any
            e.target.value = e.target.value.slice(0, -1);
        }
        else if (e.target.value.slice(-1) == '1') { // reserved for selecting male radio, if gender practice
            e.target.value = e.target.value.slice(0, -1);
        }
        else if (e.target.value.slice(-1) == '2') { // reserved for selecting female radio, if gender practice
            e.target.value = e.target.value.slice(0, -1);
        }
        else if (e.target.value.slice(-1) == '3') { // reserved for selecting neutral radio, if gender practice
            e.target.value = e.target.value.slice(0, -1);
        }
        else {
            setAnswer(e.target.value);
        }
    }

    function genderChanged(e) {

        setAnswerGender(e.target.value);

        document.getElementById('answer').focus(); // if radio clicked directly, re-focus input for answer
    }

    useEffect(() => {

        document.getElementById('answer').focus();

        document.addEventListener("keydown", handleKeyboard);
        return () => document.removeEventListener("keydown", handleKeyboard);

    }); // runs after every re-render

    function checkAnswer () {

        setCheckingAnswer(true);

        let r = true; // redo current word (can't use message=='incorrect')

        var correctTranslations = [];

        if (translationFrom)
            word.translations.forEach(w => correctTranslations.push(w['word_text']));
        else 
            correctTranslations.push(word['word_text']);

        if (practiceNounGender && translationFrom) { // if gender practice is active

            if (correctTranslations.includes(answer) && answerGender == word['gender']) {
                word.correct += 1;
                setMessage('correct');
                r = false;
            }
            else {
                word.mistakes += 1;
                setMessage('incorrect');
            }
            
            // highlight correct gender
            setHighlighted(word['gender']);
        }
        else {
            if (correctTranslations.includes(answer)) { // if practicing normally (without word gender)
                word.correct += 1;
                setMessage('correct');
                r = false;
            }
            else {
                word.mistakes += 1;
                setMessage('incorrect');
            }
        }

        if (redo) {
            if (!r)   // redo current word (can't use message=='incorrect')
                trainedWords.push(word);
        }
        else {
            trainedWords.push(word);
        }
        
        setMessageAdditional(correctTranslations.join(' OR '));
    }

    function nextQuestion () {

        let wrong = message == 'incorrect' ? true : false;

        setAnswer('');
        setAnswerGender('');
        setHighlighted('');
        setMessage('');
        setMessageAdditional('');
        setCheckingAnswer(false);

        if (redo && wrong)
            onQuestionChange(word);
        else
            onQuestionChange();
    }

    return (<>
        { wordFrom.pronunciation ? 
            <AudioButton pronunciation={ wordFrom.pronunciation } onPressed={ handleAfterAudioPlayed } /> : 
            <></> }
        <label>
            { listening && translationFrom && !checkingAnswer ? 
                /* only hide the word if translating from unknown language and not checking the answer */
                '-'.repeat(wordFrom['word_text'].length) : 
                wordFrom['word_text'] }
        </label>
        { practiceNounGender && translationFrom ?
            // only add gender oriented practice if translating from unknown language
            <>
                <input 
                    id='m' 
                    type='radio'
                    name='gender' 
                    value='m' 
                    checked={ answerGender == 'm' }
                    onChange={ genderChanged }
                    disabled={ checkingAnswer } />
                <label htmlFor='m' className={ highlighted == 'm' ? 'male' : '' }>male</label>
                <input 
                    id='f' 
                    type='radio'
                    name='gender' 
                    value='f' 
                    checked={ answerGender == 'f' }
                    onChange={ genderChanged }
                    disabled={ checkingAnswer } />
                <label htmlFor='f' className={ highlighted == 'f' ? 'female' : '' }>female</label>
                <input 
                    id='n' 
                    type='radio'
                    name='gender' 
                    value='n' 
                    checked={ answerGender == 'n' }
                    onChange={ genderChanged }
                    disabled={ checkingAnswer } />
                <label htmlFor='n' className={ highlighted == 'n' ? 'neutral' : '' }>neutral</label>
            </> : 
            <></> }
        <input id="answer" type="text" autoComplete="off" value={ answer } 
            onChange={ answerChanged }
            disabled={ checkingAnswer } />

        { checkingAnswer ? 
            <input id='nxt' type="button" value="Next" onClick={ nextQuestion } /> : 
            <input type="button" value="Check answer" onClick={ checkAnswer } disabled={ isCheckAnswerButtonDisabled() } />}

        <p className={ message }>{ message }</p>
        <p className={ message }>{ messageAdditional }</p>
    </>);
}

export default DirectText
