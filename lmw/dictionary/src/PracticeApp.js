import React, { useState, useEffect } from 'react'

const PracticeApp = () => {

    const [session, setSession] = useState('')

    const fetchData = () => {
        fetch("http://localhost:8000/dictionary/react/")
            .then(response => {
                return response.json();
            })
            .then(data => {
                setSession(data.session);
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

    return (
        <div>
            Hello, World!
            <p>session_q_a = {session.q_a}</p>
        </div>
    );
}

export default PracticeApp
