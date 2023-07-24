import React, { useState, useEffect, useMemo } from "react";
import AudioButton from './AudioButton';

const MuiltiChoice = ({ word, translationFrom, otherWords, trainedWords, listening, onQuestionChange }) => {
    console.log('render MuiltiChoice');

    const [answer, setAnswer, answerInputProps] = useRadioButtons("answer");
    const [checkingAnswer, setCheckingAnswer] = useState(false);
    const [message, setMessage] = useState('');
    const [messageAdditional, setMessageAdditional] = useState('');

    const wordFrom = useMemo(
        () => translationFrom ? 
            word : word.translations[ 
                Math.floor( Math.random() * word.translations.length ) ],
        [word]);

    const correctTranslation = useMemo(
        () => translationFrom ? 
            word.translations[
                Math.floor( Math.random() * word.translations.length ) ] : word,
        [word]);
    
    const randomPlaceOfCorrect = useMemo(
        () => Math.floor( Math.random() * 2 ),
        [word]);
    
    const allAnswers = useMemo(
        () => {
            let answers = [];
            let uniqueIds = [correctTranslation['id']];
            // pick 2 other random translations from otherWords while pushing correct in a random place
            for (let i = 0; i < 3; i++) {
                if (i == randomPlaceOfCorrect) {
                    answers.push(correctTranslation);
                }
                else {
                    let randOther = otherWords[Math.floor( Math.random() * otherWords.length ) ];
                    // hopefully it won't try too many times with the same ones (it should be fine when more words in db)
                    while(uniqueIds.includes(randOther.id))
                        randOther = otherWords[Math.floor( Math.random() * otherWords.length ) ];
                    answers.push(randOther);
                    uniqueIds.push(randOther['id']);
                }
            }
            return answers;
        },
        [word, randomPlaceOfCorrect]
    );


    function handleKeyboard(e) {
        console.log('handler');

        if (!checkingAnswer) {
            for (let i = 1; i <= 3; i++) {
                if (e.key == i) {
                    document.getElementById(allAnswers[i-1]['id']).focus();
                    setAnswer(allAnswers[i-1]['word_text']);
                }
            }
        }

        if(e.key == 0 && wordFrom['pronunciation']) {
            document.getElementById(wordFrom['pronunciation'].split('.')[0]).play();
        }

        if ((e.key == 'Enter') && (answer))
            if (!checkingAnswer)
                checkAnswer();
            else
                nextQuestion()
    }

    useEffect(() => {
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
        { wordFrom['pronunciation'] ? <AudioButton pronunciation={ wordFrom['pronunciation'] } /> : <></> }
        <label>
            { listening && translationFrom && !checkingAnswer ? 
                /* only hide the word if translating from unknown language and not checking the answer */
                '-'.repeat(wordFrom['word_text'].length) : 
                wordFrom['word_text'] }
        </label>

        { allAnswers && allAnswers.map(possibleAnswer => 
            <p key={ possibleAnswer['id'] }>
                <input 
                    id ={ possibleAnswer['id'] } 
                    value={ possibleAnswer['word_text'] }
                    checked={ answer == possibleAnswer['word_text'] }
                    { ...answerInputProps }
                    disabled={ checkingAnswer } />
                { 
                    possibleAnswer['pronunciation'] ? 
                        <AudioButton pronunciation={ possibleAnswer['pronunciation'] } /> : 
                        <></>
                }
                <label htmlFor={ possibleAnswer['id'] }>
                    {
                        listening && !translationFrom && !checkingAnswer && possibleAnswer['pronunciation'] ? 
                            '-'.repeat(possibleAnswer['word_text'].length) : 
                            possibleAnswer['word_text']
                    }
                </label>
            </p>
        )}

        { checkingAnswer ? 
            <input id='nxt' type="button" value="Next" onClick={ nextQuestion } /> : 
            <input type="button" value="Check answer" onClick={ checkAnswer } disabled={ answer ? false : true } />}

        <p className={ message }>{ message }</p>
        <p className={ message }>{ messageAdditional }</p>
    </>);
}

function useRadioButtons(name) {
    const [value, setState] = useState(null);
    
    const handleChange = e => {
      setState(e.target.value);
    };
    
    const inputProps = {
      name,
      type: "radio",
      onChange: handleChange
    };
  
    return [value, setState, inputProps];
}

export default MuiltiChoice
