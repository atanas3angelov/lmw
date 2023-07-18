import React, { useState, useEffect, useMemo, memo } from 'react'

const baseUrl = 'http://localhost:8000';
const reactUrl = baseUrl + '/dictionary/react/';
const filesDir = baseUrl + '/dictionary/files/';

const AudioButton = memo(({pronunciation}) => {
    console.log('render AudioButton');

    let audioId = "audio";
    let audioSrcUrl = filesDir + pronunciation;
    let buttonImgSrcUrl = filesDir + 'audio.jpg';

    const playAudio = (audioId) => {
        document.getElementById(audioId).play()
    }

    if(pronunciation && pronunciation.split('.').pop() == 'mp3')

        return (<>
            <audio id={ audioId }>
                <source src={ audioSrcUrl } type="audio/mpeg" />
            </audio>
            <button type="button" onClick={ () => playAudio( audioId ) }>
                {/* <img src= '../../files/audio.jpg'  height="10" /> */}
                <img src= { buttonImgSrcUrl }  height="10" />
            </button>
        </>);
    else
        return (<></>)
});

// const DirectTextQ = ({ word, answer, listening, onAnswerChange, onCheckAnswer}) => {
//     console.log('render DirectTextQ');

//     let wordText = listening ? '' : word['word_text'];

//     const isDisabled = answer ? false : true;

//     function onEnter(e) {
//         if (e.key == 'Enter' && e.target.value)
//             onCheckAnswer();
//     }

//     return (<>
//         { word.pronunciation ? <AudioButton pronunciation={ word.pronunciation } /> : <></> }
//         <label>{ wordText }</label>
//         <input id="answer" type="text" autoComplete="off" autoFocus
//             onChange={(e) => onAnswerChange(e.target.value)}
//             onKeyDown={(e) => onEnter(e)} />

//         <input type="button" value="Check answer" onClick={ onCheckAnswer } disabled={ isDisabled } />
//     </>);
// }

// const DirectTextA = ({ word, answer, message, messageAdditional, onNextQuestion }) => {
//     console.log('render DirectTextA');

//     return (<>
//         { word.pronunciation ? <AudioButton pronunciation={ word.pronunciation } /> : <></> }
//         <label>{ word['word_text'] }</label>
//         <input id="answer" type="text" value={ answer } disabled />

//         <input type="button" value="Next" onClick={ onNextQuestion } />

//         <p className={ message }>{ message }</p>
//         <p className={ message }>{ messageAdditional }</p>
//     </>);
// }

const MuiltiChoice = ({ word, translationFrom, otherWords, trainedWords, listening, onQuestionChange }) => {
    console.log('render MuiltiChoice');

    // const [answer, setAnswer] = useState('');
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
            let uniqueIds = [correctTranslation.id];
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
                }
            }
            return answers;
        },
        [word, randomPlaceOfCorrect]
    );

    // useEffect(() => {
    // }, []); // runs only on mount
    // useEffect(() => {
    // }); // runs after every re-render

    function onKey(e) {
        // change radio select on 1, 2, 3

        if (e.key == 'Enter')
            checkAnswer();
    }

    function checkAnswer () {

        setCheckingAnswer(true);

        var correctTranslations = [];

        if (translationFrom)
            word.translations.forEach(w => correctTranslations.push(w['word_text']));
        else
            correctTranslation.push(word['word_text']);

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

        onQuestionChange(word);
    }

    return (<>
        { wordFrom.pronunciation ? <AudioButton pronunciation={ wordFrom.pronunciation } /> : <></> }
        <label>{ wordFrom['word_text'] }</label>

        {/* <input id="answer" type="text" autoComplete="off" value={ answer } 
            onChange={ (e) => setAnswer(e.target.value) }
            onKeyDown={ (e) => onEnter(e) }
            disabled={ checkingAnswer } /> */}
        { allAnswers && allAnswers.map(possibleAnswer => 
            <p key={ possibleAnswer.id }>
                <input 
                    id ={ possibleAnswer.id } 
                    value={ possibleAnswer['word_text'] }
                    checked={ answer == possibleAnswer['word_text'] }
                    { ...answerInputProps }
                    onKeyDown={ (e) => onKey(e) }
                    disabled={ checkingAnswer } />
                <label htmlFor={ possibleAnswer.id }>
                    {possibleAnswer.word_text}
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


    // useEffect(() => {

    // }, []); // runs only on mount
    useEffect(() => {

        // ref.current && ref.current.focus();

        document.getElementById('answer').focus();
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

    function onEnter(e) {
        if (e.key == 'Enter' && e.target.value)
            checkAnswer();
    }

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
            onKeyDown={ (e) => onEnter(e) }
            disabled={ checkingAnswer } />

        { checkingAnswer ? 
            <input id='nxt' type="button" value="Next" onClick={ nextQuestion } /> : 
            <input type="button" value="Check answer" onClick={ checkAnswer } disabled={ answer ? false : true } />}

        <p className={ message }>{ message }</p>
        <p className={ message }>{ messageAdditional }</p>
    </>);
}

const PracticePane = ({ session, words, otherWordsFrom, otherWordsTo }) => {
    console.log('render PracticePane');

    // const [answer, setAnswer] = useState('');
    // const [answerPane, setAnswerPane] = useState(false);
    // const [message, setMessage] = useState('');
    // const [messageAdditional, setMessageAdditional] = useState('');

    const [word, setWord] = useState(null);
    const [trainedWords] = useState([]);
    const [questionType, setQuestionType] = useState(null);
    const [translationFrom, setTranslationFrom] = useState(true);

    console.log(words);

    // var word;

    // if (words.length > 0) {
    //     word = words[0];
    //     // word = words.shift()
    // } else {
    //     console.warn('No words to practice!');
    // }

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

    function decideOnQuestionType() {

        // TODO use react memo for allowed computation
        let allowedQuestionTypes = [];

        if (session['direct_text'])
            allowedQuestionTypes.push('direct_text');
        if (session['multiple_choice'])
            allowedQuestionTypes.push('multiple_choice');
        if (session['multiple_choice_connect'])
            allowedQuestionTypes.push('multiple_choice_connect');
        if (session['listening'])
            allowedQuestionTypes.push('listening');
        if (session['listening_multiple_choice'])
            allowedQuestionTypes.push('listening_multiple_choice');
        
        if (allowedQuestionTypes.length == 0)
            allowedQuestionTypes = [
                'direct_text', 
                'multiple_choice', 
                'multiple_choice_connect',
                'listening',
                'listening_multiple_choice'
            ];
        
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

    // function checkAnswer () {

    //     var correctTranslations = [];

    //     word.translations.forEach(w => correctTranslations.push(w['word_text']));

    //     if (correctTranslations.includes(answer)) {
    //         word.correct += 1;
    //         setMessage('correct');
    //     }
    //     else {
    //         word.mistakes += 1;
    //         setMessage('incorrect');
    //     }
        
    //     setMessageAdditional(correctTranslations.join(' OR '));

    //     trainedWords.push(word);

    //     setAnswerPane(true);
    // }

    // function nextQuestion () {

    //     // decide on question type


    //     if (words.length > 0) {
    //         words.shift();
    //     } else {
    //         questionAnswer = <></>;
    //     }

    //     setAnswer('');
    //     setAnswerPane(false);
    // }

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
            questionAnswer = 
                <DirectText 
                    word={ word } 
                    translationFrom = { translationFrom } 
                    trainedWords={ trainedWords }
                    listening={ false } 
                    onQuestionChange={ nextQuestion } />;
            break;
        case 'multiple_choice':
            questionAnswer = 
                <MuiltiChoice 
                    word={ word } 
                    translationFrom = { translationFrom } 
                    otherWords={ translationFrom ? otherWordsFrom: otherWordsTo } 
                    trainedWords={ trainedWords } 
                    listening={ false } 
                    onQuestionChange={ nextQuestion } />;
            break;
        case 'multiple_choice_connect':
        case 'listening':
        case 'listening_multiple_choice':
        default:
            <></>
    }

    // const questionAnswer = answerPane ? 
    //     <DirectTextA 
    //         word={ word } 
    //         answer={ answer } 
    //         message={ message } 
    //         messageAdditional={ messageAdditional } 
    //         onNextQuestion={ nextQuestion } /> :
    //     <DirectTextQ 
    //         word={ word } 
    //         answer={ answer }
    //         listening={ false } 
    //         onAnswerChange={ (val) => setAnswer(val) } 
    //         onCheckAnswer={ checkAnswer } />;
    
    return (<div id="form_pane">
        <div className="control">
            <input type="submit" value="End" onClick={() => end()} />
        </div>
        <div id="practice_pane">
            { word ? questionAnswer : <></>}
        </div>
    </div>)
}

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
            { err ? <p style={{color: 'red'}}><strong> {{ err }} </strong></p> : <></> }
        </div>
        { words.length > 0 ? 
            <PracticePane session={session} words={words} 
                otherWordsFrom={ otherWordsFrom }
                otherWordsTo={ otherWordsTo } /> : <></> }
    </>);
}

export default PracticeApp
