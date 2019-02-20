import React, {useState} from 'react';
import {postJson} from './fetch-util';
import './Game.css';

const INDEXES = [0, 1, 2];

function Game({player, game}) {
  const {board, id, player1, player2, winner} = game;
  const [localBoard, setBoard] = useState(board);
  console.log('Game.js x: board =', board);
  console.log('Game.js x: player =', player);
  console.log('Game.js x: player1 =', player1);
  const marker = player === player1 ? 'X' : 'O';

  const move = async (row, column) => {
    try {
      localBoard[row][column] = marker;
      const res = await postJson('move', {gameId: id, row, column, marker});
      const text = await res.text();
      if (res.ok) {
        setBoard([...localBoard]);
        if (text) alert(`Winner is ${text}!`);
      } else {
        alert(text);
      }
    } catch (e) {
      alert('Error making move');
    }
  };

  let className = 'game';
  if (winner) className += ' over';

  return (
    <div className={className}>
      <header>
        {player1} vs. {player2}
        {winner && ` - ${winner} won!`}
      </header>
      {INDEXES.map(row => (
        <div className="row" key={`row${row}`}>
          {INDEXES.map(column => (
            <div
              className="position"
              key={`column${column}`}
              onClick={() => move(row, column)}
            >
              {board[row][column]}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default Game;
