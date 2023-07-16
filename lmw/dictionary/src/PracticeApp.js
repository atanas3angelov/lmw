import React, { useState, useEffect } from 'react'

const base_url = 'http://localhost:8000';
const react_url = base_url + '/dictionary/react/';
const files_dir = base_url + '/dictionary/files/';

const AudioButton = ({pronunciation}) => {
    console.log('render AudioButton');

    let audio_id = "audio";
    let audio_src_url = files_dir + pronunciation;
    let button_img_src_url = files_dir + 'audio.jpg';

    const playAudio = (audio_id) => {
        document.getElementById(audio_id).play()
    }

    if(pronunciation && pronunciation.split('.').pop() == 'mp3')

        return (<>
            <audio id={ audio_id }>
                <source src={ audio_src_url } type="audio/mpeg" />
            </audio>
            <button type="button" onClick={ () => playAudio( audio_id ) }>
                {/* <img src= '../../files/audio.jpg'  height="10" /> */}
                <img src= { button_img_src_url }  height="10" />
            </button>
        </>);
    else
        return (<></>)
}

// const DirectTextQ = ({ word, answer, listening, onAnswerChange, onCheckAnswer}) => {
//     console.log('render DirectTextQ');

//     let word_text = listening ? '' : word.word_text;

//     const isDisabled = answer ? false : true;

//     function onEnter(e) {
//         if (e.key == 'Enter' && e.target.value)
//             onCheckAnswer();
//     }

//     return (<>
//         { word.pronunciation ? <AudioButton pronunciation={ word.pronunciation } /> : <></> }
//         <label>{ word_text }</label>
//         <input id="answer" type="text" autoComplete="off" autoFocus
//             onChange={(e) => onAnswerChange(e.target.value)}
//             onKeyDown={(e) => onEnter(e)} />

//         <input type="button" value="Check answer" onClick={ onCheckAnswer } disabled={ isDisabled } />
//     </>);
// }

// const DirectTextA = ({ word, answer, message, message_additional, onNextQuestion }) => {
//     console.log('render DirectTextA');

//     return (<>
//         { word.pronunciation ? <AudioButton pronunciation={ word.pronunciation } /> : <></> }
//         <label>{ word.word_text }</label>
//         <input id="answer" type="text" value={ answer } disabled />

//         <input type="button" value="Next" onClick={ onNextQuestion } />

//         <p className={ message }>{ message }</p>
//         <p className={ message }>{ message_additional }</p>
//     </>);
// }

const DirectText = ({ word, trained_words, listening, onQuestionChange }) => {
    console.log('render DirectText');

    const [answer, setAnswer] = useState('');
    const [checkingAnswer, setCheckingAnswer] = useState(false);
    const [message, setMessage] = useState('');
    const [message_additional, setMessage_additional] = useState('');
    // const ref = useRef(null);
    // const ref2 = useRef(null);

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

        var correct_translations = [];

        word.translations.forEach(w => correct_translations.push(w.word_text));

        if (correct_translations.includes(answer)) {
            word.correct += 1;
            setMessage('correct');
        }
        else {
            word.mistakes += 1;
            setMessage('incorrect');
        }

        trained_words.push(word);
        
        setMessage_additional(correct_translations.join(' OR '));
    }

    function nextQuestion () {

        setAnswer('');
        setMessage('');
        setMessage_additional('');
        setCheckingAnswer(false);

        onQuestionChange(word);
    }

    return (<>
        { word.pronunciation ? <AudioButton pronunciation={ ''+word.pronunciation } /> : <></> }
        <label>{ word.word_text }</label>
        <input id="answer" type="text" autoComplete="off" value={ answer } 
            onChange={ (e) => setAnswer(e.target.value) }
            onKeyDown={ (e) => onEnter(e) }
            disabled={ checkingAnswer } />

        { checkingAnswer ? 
            <input id='nxt' type="button" value="Next" onClick={ nextQuestion } /> : 
            <input type="button" value="Check answer" onClick={ checkAnswer } disabled={ answer ? false : true } />}

        <p className={ message }>{ message }</p>
        <p className={ message }>{ message_additional }</p>
    </>);
}

const PracticePane = ({ session, words }) => {
    console.log('render PracticePane');

    // const [answer, setAnswer] = useState('');
    // const [answerPane, setAnswerPane] = useState(false);
    // const [message, setMessage] = useState('');
    // const [message_additional, setMessage_additional] = useState('');

    const [word, setWord] = useState(null);
    const [trained_words] = useState([]);

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
    }, []);

    function nextQuestion(word) {

        if (words.length > 0)
            setWord(words.shift());
        else
            setWord(null);
    }

    // function checkAnswer () {

    //     var correct_translations = [];

    //     word.translations.forEach(w => correct_translations.push(w.word_text));

    //     if (correct_translations.includes(answer)) {
    //         word.correct += 1;
    //         setMessage('correct');
    //     }
    //     else {
    //         word.mistakes += 1;
    //         setMessage('incorrect');
    //     }
        
    //     setMessage_additional(correct_translations.join(' OR '));

    //     trained_words.push(word);

    //     setAnswerPane(true);
    // }

    // function nextQuestion () {

    //     // decide on question type


    //     if (words.length > 0) {
    //         words.shift();
    //     } else {
    //         question_answer = <></>;
    //     }

    //     setAnswer('');
    //     setAnswerPane(false);
    // }

    const end = () => {

        const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        const request = new Request(
            react_url,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify(trained_words),
                mode: 'same-origin' // Do not send CSRF token to another domain.
            }
        );

        fetch(request)
            .then(response => response.json())
            .then(body => {
                window.location.href = base_url + body.redirect_url;
            });
    }

    const question_answer = 
        <DirectText 
            word={ word } 
            trained_words={ trained_words }
            listening={ false } 
            onQuestionChange={ nextQuestion } />;

    // const question_answer = answerPane ? 
    //     <DirectTextA 
    //         word={ word } 
    //         answer={ answer } 
    //         message={ message } 
    //         message_additional={ message_additional } 
    //         onNextQuestion={ nextQuestion } /> :
    //     <DirectTextQ 
    //         word={ word } 
    //         answer={ answer }
    //         listening={ false } 
    //         onAnswerChange={ (val) => setAnswer(val) } 
    //         onCheckAnswer={ checkAnswer } />;
    
    return (<div id="form_pane">
        <div className="control">
            {/* { next_button } */}
            <input type="submit" value="End" onClick={() => end()} />
        </div>
        <div id="practice_pane">
            { word ? question_answer : <></>}
        </div>
    </div>)
}

const PracticeApp = () => {
    console.log('render PracticeApp');

    const [session, setSession] = useState('');
    const [words, setWords] = useState([]);

    const fetchData = () => {
        fetch(react_url)
            .then(response => {
                return response.json();
            })
            .then(data => {
                setSession(data.session);
                setWords(data.words);
                console.log(data.session);
                console.log(data.words);
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
            
        </div>
        { words.length > 0 ? <PracticePane session={session} words={words} /> : <></> }
    </>);
}

export default PracticeApp
