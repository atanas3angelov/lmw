import React, { useState, useEffect } from 'react'

const base_url = 'http://localhost:8000/';
const dictionary_url = base_url + 'dictionary/';
const react_url = base_url + 'dictionary/react/';
const files_dir = base_url + 'dictionary/files/';

const CheckButton = ({ onCheckAnswer }) => {


    return (
        <input 
            id="check_answer" 
            type="submit" 
            value="Check answer" 
            onClick = {() => onCheckAnswer()} />
    );
}

const NextButton = ({ onNextQuestion }) => {


    return (
        <input 
            id="next" 
            type="submit" 
            value="Next" 
            onClick = {() => onNextQuestion()} />
    );
}

const AudioButton = ({pronunciation}) => {

    let audio_id = "audio";
    let audio_src_url = files_dir + pronunciation;
    let button_img_src_url = dictionary_url + 'audio.jpg';

    if(pronunciation && pronunciation.split('.').pop() == 'mp3')

        return (<>
            <audio id="{ audio_id }">
                <source src="{ audio_src_url }" type="audio/mpeg" />
            </audio>
            <button type="button" onClick="playAudio('{ audio_id }')">
                <img src="{ button_img_src_url }" height="10" />
            </button>
        </>);
    else
        return (<></>)
}

const DirectTextQ = ({ word, listening, onAnswerChange }) => {
    let word_text = listening ? '' : word.word_text;

    return (<>
        <AudioButton pronunciation={word.pronunciation} />
        <label>{ word_text }</label>
        <input id="answer" type="text" autoComplete="off" onChange={(e) => onAnswerChange(e.target.value)} />
    </>);
}

const DirectTextA = ({ word, message, message_additional }) => {
    return (<>
        <AudioButton pronunciation={word.pronunciation} />
        <label>{ word_text }</label>
        <input id="answer" type="text" autoComplete="off" disabled />
        <p className="{ message }">{{ message }}</p>
        <p className="{ message }">{{ message_additional }}</p>
    </>);
}

const PracticePane = ({ session, words }) => {

    const [answer, setAnswer] = useState('');
    const [answerPane, setAnswerPane] = useState(false);
    
    var word;
    var trained_words = [];
    var message = '';
    var message_additional = '';

    if (words.length > 0) {
        word = words.shift();
    } else {
        console.warn('No words to start practice!');
    }

    const checkAnswer = () => {
        
        var correct_translations = [];

        word.translations.forEach(w => correct_translations.push(w.word_text));

        if (correct_translations.includes(answer)) {
            word.correct += 1;
            message = 'correct';
        }
        else {
            word.mistakes += 1;
            message = 'incorrect';
        }
        
        message_additional = '[' + correct_translations.join(' ') + ']';

        setAnswerPane(true);
    }

    const nextQuestion = () => {

        // decide on question type

        trained_words.push(word);

        if (words.length > 0) {
            word = words.shift();
        } else {
            question_answer = '';
            next_button = '';
        }

        setAnswerPane(false);
    }

    const end = () => {

        // send trained_words (with updated correct/mistakes ) to backend (backend will fix the last_practiced)
        // (async () => {
            // const rawResponse = await 
            fetch(react_url, {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(trained_words)
            });
            // const content = await rawResponse.json();
          
            // console.log(content);
        //   })();

    }

    let next_button = answerPane ? 
        <NextButton onNextQuestion={nextQuestion} /> : 
        <CheckButton onCheckAnswer={checkAnswer} />;
    
    let question_answer = answerPane ? 
        <DirectTextA word={word} message={message} message_additional={message_additional} /> : 
        <DirectTextQ word={word} listening={false} onAnswerChange = {(val) => setAnswer(val)} />;

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

    const [session, setSession] = useState('');
    const [words, setWords] = useState([]);

    let practicePane = words.length > 0 ? <PracticePane session={session} words={words} /> : <></>;

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
        { practicePane }
        {/* <PracticePane session={session} words={words} /> */}
    </>);
}

export default PracticeApp
