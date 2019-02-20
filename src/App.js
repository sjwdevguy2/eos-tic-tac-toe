import React, {useState} from 'react';
import {getJson, postJson} from './fetch-util';
import Game from './Game';
import './App.css';

const ws = new WebSocket('ws://localhost:1920');

function useFormInput(initialValue) {
  const [value, setValue] = useState(initialValue);
  const onChange = e => setValue(e.target.value);
  // Returning these values in an object instead of an array
  // allows it to be spread into the props of an HTML input.
  return {onChange, value};
}

function App() {
  const [games, setGames] = useState([]);
  console.log('App.js: games =', games);
  const nameProps = useFormInput('');
  const name = nameProps.value;
  const opponentProps = useFormInput('');
  const opponent = opponentProps.value;

  ws.addEventListener('message', event => {
    console.log('ws received:', event.data);
    const {gameId, row, column, marker, winner} = JSON.parse(event.data);
    console.log('App.js ws message: gameId =', gameId);
    console.log('App.js ws message: typeof gameId =', typeof gameId);
    console.log('App.js ws message: games =', games);
    const game = games.find(game => game.id === gameId);
    if (game) {
      game.board[row][column] = marker;
      if (winner) alert(`${winner} won!`);
      //} else {
      //  console.error(`No game with id ${gameId} was found!`);
    }
  });

  const clearGames = () => setGames(games.filter(game => !game.winner));

  const createGame = async () => {
    console.log('App.js createGame: name =', name);
    console.log('App.js createGame: opponent =', opponent);
    try {
      const res = await postJson('game', {
        player1: name,
        player2: opponent
      });
      const game = await res.json();
      console.log('App.js createGame: game =', game);
      setGames([...games, game]);
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
        <button disabled={!name} onClick={loadGames}>
          Load Games
        </button>
      </div>
      <div>
        <label>Opponent</label>
        <input {...opponentProps} />
        <button disabled={!opponent} onClick={createGame}>
          Play
        </button>
      </div>
      {games.map(game => (
        <Game player={name} game={game} key={game.id} />
      ))}
      <button disabled={games.length === 0} onClick={clearGames}>
        Clear Completed Games
      </button>
    </div>
  );
}

export default App;
