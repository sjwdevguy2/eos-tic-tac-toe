import React, {useCallback, useState} from 'react';
import {getJson, postJson} from './fetch-util';
import Game from './Game';
import './App.css';

const ws = new WebSocket('ws://localhost:1920');

let lastGameMap, lastSetGameMap;
ws.addEventListener('message', event => {
  const details = JSON.parse(event.data);
  const {gameId, row, column, marker, winner} = details;
  const game = lastGameMap[gameId];
  if (game) {
    game.board[row][column] = marker;
    game.winner = winner;
    lastSetGameMap({...lastGameMap, [game.id]: game});
    if (winner) alert(`${winner} won!`);
  }
});

function useFormInput(initialValue) {
  const [value, setValue] = useState(initialValue);
  const onChange = e => setValue(e.target.value);
  // Returning these values in an object instead of an array
  // allows it to be spread into the props of an HTML input.
  return {onChange, value};
}

function App() {
  const [gameMap, setGameMap] = useState({});
  lastGameMap = gameMap;
  lastSetGameMap = setGameMap;
  const nameProps = useFormInput('');
  const name = nameProps.value;
  const opponentProps = useFormInput('');
  const opponent = opponentProps.value;

  const clearGames = useCallback(() => {
    const newGameMap = Object.values(gameMap).reduce((acc, game) => {
      if (!game.winner) acc[game.id] = game;
      return acc;
    }, {});
    setGameMap(newGameMap);
  }, [gameMap]);

  const createGame = async () => {
    try {
      const res = await postJson('game', {
        player1: name,
        player2: opponent
      });
      const game = await res.json();
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
