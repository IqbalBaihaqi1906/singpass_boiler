import logo from './logo.svg';
import './App.css';
import { useEffect, useState } from "react";
import axios from 'axios'

function App() {

  const [clientId, setClientId] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [authApiUrl, setAuthApiUrl] = useState('');
  const [attributes, setAttributes] = useState('');
  const [authLevel, setAuthLevel] = useState('');

  useEffect(() => {
    getEnv()
  },[])

  const getEnv = async () => {
    try {
      let dataEnv = await axios({
        url : 'http://localhost:3001/singpass/getEnv',
        method : 'get'
      })
      dataEnv = dataEnv.data
      setClientId(dataEnv.clientId)
      setRedirectUrl(dataEnv.redirectUrl)
      setAuthApiUrl(dataEnv.authApiUrl)
      setAttributes(dataEnv.attributes)
      setAuthLevel(dataEnv.authLevel)
      // console.log(dataEnv)
    } catch (error) {
      console.log(error)
    }
  }

  function callAuthoriseApi() {
    const purpose = "Learning";
    const state = '123'
    const authoriseUrl = authApiUrl + "?client_id=" + clientId +
      "&attributes=" + attributes +
      "&purpose=" + purpose +
      "&state=" + encodeURIComponent(state)  +
      "&redirect_uri=" + redirectUrl;

    window.location = authoriseUrl;
  }
  return (
    <div className="App">
      <h1>SINGPASS BOILER PLATE</h1>
      <br/>
      <br/>
      <br/>
      <br/>


      <button onClick={callAuthoriseApi}>Get Info</button>
    </div>
  );
}

export default App;
