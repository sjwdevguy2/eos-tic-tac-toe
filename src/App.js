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
  const [gameMap, setGameMap] = useState([]);
  const nameProps = useFormInput('');
  const name = nameProps.value;
  const opponentProps = useFormInput('');
  const opponent = opponentProps.value;

  ws.addEventListener('message', event => {
    console.log('ws event =', event);
    const {gameId, row, column, marker, winner} = JSON.parse(event.data);
    const game = gameMap[gameId];
    if (game) {
      game.board[row][column] = marker;
      setGameMap({...gameMap, [game.id]: game});
      if (winner) alert(`${winner} won!`);
      //} else {
      //  console.error(`No game with id ${gameId} was found!`);
    }
  });

  const clearGames = () => {
    console.log('App.js clearGames: gameMap =', gameMap);
    const newGameMap = gameMap.reduce((acc, game) => {
      if (!game.winner) acc[game.id] = game;
      return acc;
    }, {});
    setGameMap(newGameMap);
  };

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
      setGameMap({...gameMap, [game.id]: game});
    } catch (e) {
      console.error('Error creating game:', e);
    }
  };

  const loadGames = async () => {
    try {
      const gameMap = await getJson(`games/${name}`);
      setGameMap(gameMap);
    } catch (e) {
      console.error('Error loading games:', e);
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
      {Object.values(gameMap).map(game => (
        <Game player={name} game={game} key={game.id} />
      ))}
      <button disabled={Object.keys(gameMap).length === 0} onClick={clearGames}>
        Clear Completed Games
      </button>
    </div>
  );
}

export default App;
