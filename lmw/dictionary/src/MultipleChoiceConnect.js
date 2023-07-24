import React, { useState, useEffect, useMemo } from "react";

const MuiltiChoiceConnect = ({ words, trainedWords, onQuestionChange }) => {
    console.log('render MuiltiChoiceConnect');

    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [correctlyAnswered, setCorrectlyAnswered] = useState([]);
    
    const shuffleAnswers = useMemo(
        () => {
            let pattern = Array.from(Array(words.length).keys())

            for (let i = pattern.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pattern[i], pattern[j]] = [pattern[j], pattern[i]];
            }

            return pattern;
        },
        [words]);
    
    const allAnswers = useMemo(
        () => {
            let answers = [];  // each el is object: {questionWord['id'] : questionWord.translations[random]} (id: used in comparing question & answer radios)

            for (let i = 0; i < shuffleAnswers.length; i++) {
                    // use the word's id for the radio value comparison in both groups
                    const key = words[shuffleAnswers[i]]['id'];
                    // choose rand translation
                    const val = words[shuffleAnswers[i]].translations[
                        Math.floor( Math.random() * words[shuffleAnswers[i]].translations.length )
                    ];
                    const obj = {};
                    obj[key] = val;
                    answers.push(obj);
                }
                return answers;
            },
        [words, shuffleAnswers]
    );

    function handleKeyboard(e) {
        console.log('handler');

        for (let i = 1; i <= words.length; i++) {
            if ((e.key == i) && (!correctlyAnswered.includes(words[i-1]['id']))) {

                if (answer) {
                    document.getElementById(words[i-1]['id']).focus();
                    const event = new CustomEvent("alreadyAnsweredSetQuestion", {detail: words[i-1]['id']});
                    checkAnswer(event);
                }
                else {
                    document.getElementById(words[i-1]['id']).focus();
                    setQuestion(words[i-1]['id']);
                    checkAnswer();
                }
            }
        }
        if ((e.key == 'Enter') && (correctlyAnswered.length == words.length))
            nextQuestion()
    }

    useEffect(() => {
        document.addEventListener("keydown", handleKeyboard);
        return () => document.removeEventListener("keydown", handleKeyboard);
    }); // runs after every re-render

    function checkAnswerInner(q, a) {
        if (q && a) {

            let word = words.find(word => word.id == q);

            if (q == a) {
                word['correct'] += 1;

                trainedWords.push(word);
                correctlyAnswered.push(word['id']);

                // prevent disabling of radio in stucking the listener
                document.activeElement.blur();

                setQuestion('');
                setAnswer('');
            }
            else {
                word['mistakes'] += 1;

                setQuestion('');
                setAnswer('');
            }
        }
    }

    function checkAnswer(e) {

        // if using keyboard to set question when answer already set
        if (e && e.type == 'alreadyAnsweredSetQuestion') {
            checkAnswerInner(e.detail, answer);
        }
        else { // if using mouse clicks
            if (e && e.target.name == 'question') {
                if (answer) {
                    checkAnswerInner(e.target.value, answer);
                }
                else {
                    setQuestion(Number(e.target.value));
                }
            }
    
            if (e && e.target.name == 'answer') {
                if (question) {
                    checkAnswerInner(question, e.target.value);
                }
                else {
                    setAnswer(Number(e.target.value));
                }
            }

            // if using keyboard to set question when no answer already set
            checkAnswerInner(question, answer);
        }
    }

    function nextQuestion () {

        setCorrectlyAnswered([]);
        onQuestionChange();
    }

    return (<>
        <table>
            <tbody>
                <tr>
                    <td>
                        {
                            words.map(leftWord => 
                                <p key={ leftWord['id'] }>
                                    <input 
                                        id={ leftWord['id'] }
                                        type='radio' 
                                        name='question' 
                                        value={ leftWord['id'] }
                                        checked={ question == leftWord['id'] }
                                        disabled={ correctlyAnswered.includes(leftWord['id']) } 
                                        onChange={ checkAnswer } />
                                    <label htmlFor={ leftWord['id'] }>
                                        { leftWord['word_text'] }
                                    </label>
                                </p>
                        )}
                    </td>
                    <td>
                        {
                            allAnswers.map(rightWord =>
                                <p key={ rightWord[Object.keys(rightWord)[0]]['id'] }>
                                    <input 
                                        id={ rightWord[Object.keys(rightWord)[0]]['id'] }
                                        type='radio' 
                                        name='answer' 
                                        value={ Object.keys(rightWord).map(Number)[0] } 
                                        checked={ answer == Object.keys(rightWord)[0] }
                                        disabled={ correctlyAnswered.includes(Object.keys(rightWord).map(Number)[0]) }
                                        onChange={ checkAnswer } />
                                    <label htmlFor={ rightWord[Object.keys(rightWord)[0]]['id'] }>
                                        { rightWord[Object.keys(rightWord)[0]]['word_text'] }
                                    </label>
                                </p>
                        )}
                    </td>
                </tr>
            </tbody>
        </table>

        <input id='nxt' type="button" value="Next" onClick={ nextQuestion } disabled={ correctlyAnswered.length != words.length } />
    </>);
}

export default MuiltiChoiceConnect
