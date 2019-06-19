import React, {useState} from 'react';
import {postJson} from './fetch-util';
import Dialog from './Dialog';
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
    //if (winner) alert(`${winner} won!`);
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
  const nameProps = useFormInput('');//('tttplayerxxx');
  const name = nameProps.value;
  const opponentProps = useFormInput('');//('tttplayerooo');
  const opponent = opponentProps.value;

  // const clearGames = useCallback(() => {
  //   const newGameMap = Object.values(gameMap).reduce((acc, game) => {
  //     if (!game.winner) acc[game.id] = game;
  //     return acc;
  //   }, {});
  //   setGameMap(newGameMap);
  // }, [gameMap]);

  // const clearAllGames = useCallback(() => {
  //    setGameMap({});
  // }, [gameMap]);

  const createGame = async () => {
    try {
      const res = await postJson('game', {
        player1: name,
        player2: opponent
      });
      const game = await res.json();
      
      console.info('createGame', game);
      
      if (game === null)
        alert('Error creating game');
      else 
        setGameMap({[game.id]: game});
        //setGameMap({...gameMap, [game.id]: game});

    } catch (e) {
      alert(`Error creating game: ${e.message}`);
    }
  };

  // const loadGames = async () => {
  //   try {
  //     console.info('loadGames', 'name', name, 'opponent', opponent);
  //     const gameMap = await getJson(`games/${name + '|' + opponent}`);
  //     setGameMap(gameMap);
  //   } catch (e) {
  //     alert(`Error loading games: ${e.message}`);
  //   }
  // };

  return (
    <div className="App">
      <div>
        <label>Host</label>
        <input {...nameProps}/>
        {/* <button disabled={!name || !opponent} onClick={loadGames}>
          Load Games
        </button> */}
      </div>
      <div>
        <label>Challenger</label>
        <input {...opponentProps} />
        <button disabled={!name || !opponent} onClick={createGame}>
          Create
        </button>
      </div>
      {Object.values(gameMap).map(game => (
        <div key={game.id}>
          <Game player={name} game={game} />
        </div>
      ))}
      {/* <button disabled={Object.keys(gameMap).length === 0} onClick={clearGames}>
        Clear Completed Games
      </button>
      <button disabled={Object.keys(gameMap).length === 0} onClick={clearAllGames}>
        Clear All Games
      </button> */}
      <Dialog />
    </div>
  );
}

export default App;
