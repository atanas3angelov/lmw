import React, { memo } from 'react';

import { filesDir } from './PracticeApp';

const AudioButton = memo(({ pronunciation, onPressed }) => {
    console.log('render AudioButton');

    let audioId = pronunciation.split('.')[0];
    let audioSrcUrl = filesDir + pronunciation;
    let buttonImgSrcUrl = filesDir + 'audio.jpg';

    function buttonPressed() {
        document.getElementById(audioId).play();
        onPressed && onPressed();
    }

    if(pronunciation && pronunciation.split('.').pop() == 'mp3')

        return (<>
            <audio id={ audioId }>
                <source src={ audioSrcUrl } type="audio/mpeg" />
            </audio>
            <button type="button" onClick={ buttonPressed }>
                {/* <img src= '../../files/audio.jpg'  height="10" /> */}
                <img src= { buttonImgSrcUrl }  height="10" />
            </button>
        </>);
    else
        return (<></>)
}, arePropsEqual);

function arePropsEqual(oldProps, newProps) {
    return oldProps.pronunciation === newProps.pronunciation;
}

export default AudioButton
