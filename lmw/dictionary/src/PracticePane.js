import React, { useState, useEffect, useMemo } from 'react';
import DirectText from './DirectText';
import MuiltiChoice from './MultipleChoice';
import MuiltiChoiceConnect from './MultipleChoiceConnect';

import { baseUrl, reactUrl } from './PracticeApp';

const PracticePane = ({ session, words, otherWordsFrom, otherWordsTo }) => {
    console.log('render PracticePane');

    const [word, setWord] = useState(null);
    const [trainedWords] = useState([]);
    const [questionType, setQuestionType] = useState(null);
    const [translationFrom, setTranslationFrom] = useState(true);

    console.log(words);

    useEffect(() => {
        if (words.length > 0) {
            setWord(words.shift())
        } else {
            console.warn('No words to practice!');
        }
        
        // decide on quesion type
        decideOnQuestionType()

        // decide on translation direction
        decideOnTranslationDirection();
    }, []);

    const allowedQuestionTypes = useMemo(
        () => {

            let allowed = [];

            if (session['direct_text'])
                allowed.push('direct_text');
            if (session['multiple_choice'])
                allowed.push('multiple_choice');
            if (session['multiple_choice_connect'])
                allowed.push('multiple_choice_connect');
            if (session['listening'])
                allowed.push('listening');
            if (session['listening_multiple_choice'])
                allowed.push('listening_multiple_choice');
            
            if (allowed.length == 0)
                allowed = [
                    'direct_text', 
                    'multiple_choice', 
                    'multiple_choice_connect',
                    'listening',
                    'listening_multiple_choice'
                ];
            
            return allowed;
        }, [session]);

    function decideOnQuestionType() {
        
        // select one at random
        setQuestionType(allowedQuestionTypes[Math.floor( Math.random() * allowedQuestionTypes.length )]);
    }

    function decideOnTranslationDirection() {
        if (session['translation_direction'] == 'from')
            setTranslationFrom(true);
        else if (session['translation_direction'] == 'to')
            setTranslationFrom(false);
        else {
            if (Math.random() < 0.5)
                setTranslationFrom(true);
            else
                setTranslationFrom(false);
        }
    }

    function practiceAsListening(word, questionType) {

        if (word && word['pronunciation'] && 
            (questionType == 'listening' || questionType == 'listening_multiple_choice')) {
                return true;
        }

        return false;
    }

    function nextQuestion() {

        if (words.length > 0)
            setWord(words.shift());
        else
            setWord(null);
        
        // decide on quesion type
        decideOnQuestionType()

        // decide on translation direction
        decideOnTranslationDirection();

    }

    const end = () => {

        const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        const request = new Request(
            reactUrl,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify(trainedWords),
                mode: 'same-origin' // Do not send CSRF token to another domain.
            }
        );

        fetch(request)
            .then(response => response.json())
            .then(body => {
                window.location.href = baseUrl + body['redirect_url'];
            });
    }

    let questionAnswer;
    switch (questionType) {
        case 'direct_text':
        case 'listening':
            questionAnswer = 
                <DirectText 
                    word={ word } 
                    translationFrom = { translationFrom } 
                    trainedWords={ trainedWords }
                    listening={ practiceAsListening(word, questionType) } 
                    onQuestionChange={ nextQuestion } />;
            break;
        case 'multiple_choice':
        case 'listening_multiple_choice':
            questionAnswer = 
                <MuiltiChoice 
                    word={ word } 
                    translationFrom = { translationFrom } 
                    otherWords={ translationFrom ? otherWordsFrom: otherWordsTo } 
                    trainedWords={ trainedWords } 
                    listening={ practiceAsListening(word, questionType) } 
                    onQuestionChange={ nextQuestion } />;
            break;
        case 'multiple_choice_connect':
            // get 4 words to practice or the amount remaining
            const mccWords = [];
            // remember the word currently in the react state 'word'!
            const mccNumOfWords = (words.length + 1 >= 4) ? 4 : words.length + 1;

            mccWords.push(word);
            mccWords.push(...words.splice(0, mccNumOfWords-1));

            questionAnswer = 
                <MuiltiChoiceConnect 
                    words={ mccWords } 
                    trainedWords={ trainedWords } 
                    onQuestionChange={ nextQuestion }/>
            break;
        default:
            <></>
    }
    
    return (<div id="form_pane">
        <div className="control">
            <input type="submit" value="End" onClick={() => end()} />
        </div>
        <div id="practice_pane">
            { word ?
                questionType != 'multiple_choice_connect' ? 
                    translationFrom ? 
                        <h4>Translate from {session['lang']}:</h4> : 
                        <h4>Translate to {session['lang']}</h4> : 
                    <h4>Connect the words</h4> :
                <></> }
            { word ? questionAnswer : <></>}
        </div>
    </div>)
}

export default PracticePane
