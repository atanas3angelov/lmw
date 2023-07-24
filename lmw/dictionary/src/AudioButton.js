import React, { memo } from 'react';

import { filesDir } from './PracticeApp';

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

export default AudioButton
