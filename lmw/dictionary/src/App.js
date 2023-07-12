import React, { useState, useEffect } from 'react'

const App = () => {

    const [a, setA] = useState('')
    const [b, setB] = useState('')

    const fetchData = () => {
        fetch("http://localhost:8000/dictionary/react/")
            .then(response => {
                return response.json();
            })
            .then(data => {
                setA(data.a);
                setB(data.b);
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
            <p>a = {a}</p>
            <p>b = {b}</p>
        </div>
    );
}

export default App
