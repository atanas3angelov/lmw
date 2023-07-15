import React, { useState, useEffect, useRef } from 'react'

const base_url = 'http://localhost:8000';
const react_url = base_url + '/dictionary/react/';
const files_dir = base_url + '/dictionary/files/';
const static_files = '/dictionary/static/dictionary/';
// const files_dir = base_url + '/dictionary/static/dictionary/files/';

const CheckButton = ({ answer, onCheckAnswer }) => {
    console.log('render CheckButton');

    const isDisabled = answer ? false : true;

    return (
        <input type="button" value="Check answer" onClick={ onCheckAnswer } disabled={ isDisabled } />
    );
}

const NextButton = ({ onNextQuestion }) => {
    console.log('render NextButton');

    return (
        <input type="button" value="Next" onClick={ onNextQuestion } />
    );
}

const AudioButton = ({pronunciation}) => {
    console.log('render AudioButton');

    let audio_id = "audio";
    let audio_src_url = files_dir + pronunciation;
    let button_img_src_url = 'audio.jpg';

    const downloadFile = (filename) => {

        if (filename)
            fetch(files_dir + filename)
        // const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        // const request = new Request(
        //     files_dir,
        //     {
        //         method: 'POST',
        //         headers: {
        //             // 'Accept': 'application/json',
        //             'Content-Type': 'application/json',
        //             'X-CSRFToken': csrftoken
        //         },
        //         body: JSON.stringify({'filename': filename}),
        //         mode: 'same-origin' // Do not send CSRF token to another domain.
        //     }
        // );

        // fetch(request);

    };

    useEffect(() => {
        downloadFile('audio.jpg');
        downloadFile(pronunciation);
    }, []);

    const playAudio = (audio_id) => {
        console.log(audio_id);
        document.getElementById(audio_id).play()
    }

    if(pronunciation && pronunciation.split('.').pop() == 'mp3')

        return (<>
            <audio id={ audio_id }>
                <source src={ files_dir + pronunciation } type="audio/mpeg" />
            </audio>
            <button type="button" onClick={ () => playAudio( audio_id ) }>
                {/* <img src= '../../files/audio.jpg'  height="10" /> */}
                <img src= { files_dir + 'audio.jpg' }  height="10" />
            </button>
        </>);
    else
        return (<></>)
}

const DirectTextQ = ({ word, listening, onAnswerChange, onCheckAnswer }) => {
    console.log('render DirectTextQ');

    let word_text = listening ? '' : word.word_text;

    function onEnter(e) {
        console.log('Enter pressed');
        if (e.key == 'Enter' && e.target.value)
            onCheckAnswer();
    }

    return (<>
        <AudioButton pronunciation={word.pronunciation} />
        <label>{ word_text }</label>
        <input id="answer" type="text" autoComplete="off" autoFocus 
            onChange={(e) => onAnswerChange(e.target.value)}
            onKeyDown={(e) => onEnter(e)} />
    </>);
}

const DirectTextA = ({ word, answer, message, message_additional }) => {
    console.log('render DirectTextA');

    function onEnter(e) {
        console.log('Enter pressed');
        if (e.key == 'Enter' && e.target.value)
            onNextQuestion();
    }
    
    return (<>
        <AudioButton pronunciation={word.pronunciation} />
        <label>{ word.word_text }</label>
        <input id="answer" type="text" autoComplete="off" value={ answer } disabled />
        <p className={ message }>{ message }</p>
        <p className={ message }>{ message_additional }</p>
    </>);
}

const PracticePane = ({ session, words }) => {
    console.log('render PracticePane');

    const [answer, setAnswer] = useState('');
    const [answerPane, setAnswerPane] = useState(false);
    const [message, setMessage] = useState('');
    const [message_additional, setMessage_additional] = useState('');
    const [trained_words] = useState([]);

    console.log(words);
    var word;

    if (words.length > 0) {
        word = words[0];
        // word = words.shift();
    } else {
        console.warn('No words to start practice!');
    }

    const question_answer = answerPane ? 
        <DirectTextA 
            word={ word } 
            answer={ answer } 
            message={ message } 
            message_additional={ message_additional } /> :
        <DirectTextQ 
            word={ word } 
            listening={ false } 
            onAnswerChange={ (val) => setAnswer(val) } 
            onCheckAnswer={ checkAnswer } />;
    
    const next_button = answerPane ? 
        <NextButton onNextQuestion={ nextQuestion } /> :
        <CheckButton answer={ answer } onCheckAnswer={ checkAnswer } />;

    function checkAnswer () {

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
        
        setMessage_additional('[' + correct_translations.join(' ') + ']');

        trained_words.push(word);

        setAnswerPane(true);
    }

    function nextQuestion () {

        // decide on question type


        if (words.length > 0) {
            word = words.shift();
        } else {
            question_answer = <></>;
            next_button = <></>;
        }

        setAnswer('');
        setAnswerPane(false);
    }

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

    return (<>
        <div id="practice_pane">
            { question_answer }
        </div>
        <div className="controll">
            { next_button }
            <input type="submit" value="End" onClick={() => end()} />
        </div>
    </>)
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
            Hello, World!
        </div>
        { words.length > 0 ? <PracticePane session={session} words={words} /> : <></> }
    </>);
}

export default PracticeApp
