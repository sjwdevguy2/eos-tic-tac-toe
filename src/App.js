import React, {useState} from 'react';
import {getJson, postJson} from './fetch-util';
import Game from './Game';
import './App.css';

function useFormInput(initialValue) {
  const [value, setValue] = useState(initialValue);
  const onChange = e => setValue(e.target.value);
  // Returning these values in an object instead of an array
  // allows it to be spread into the props of an HTML input.
  return {onChange, value};
}

function App() {
  const [games, setGames] = useState([]);
  const nameProps = useFormInput('');
  const opponentProps = useFormInput('');
  const name = nameProps.value;

  const createGame = async () => {
    try {
      await postJson('game', {
        player1: name,
        player2: opponentProps.value
      });
      loadGames();
    } catch (e) {
      alert('Error creating game');
    }
  };

  const loadGames = async () => {
    try {
      const games = await getJson(`games/${name}`);
      setGames(games);
    } catch (e) {
      alert('Error loading games');
    }
  };

  return (
    <div className="App">
      <div>
        <label>Name</label>
        <input {...nameProps} />
        <button onClick={loadGames}>Load Games</button>
      </div>
      <div>
        <label>Opponent</label>
        <input {...opponentProps} />
        <button onClick={createGame}>Play</button>
      </div>
      {games.map(game => (
        <Game player={name} game={game} key={game.id} />
      ))}
    </div>
  );
}

export default App;
