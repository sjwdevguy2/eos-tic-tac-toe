import {shape, string} from 'prop-types';
import React, {useState} from 'react';

import {transact} from './eos-util';

import './Game.css';

const INDEXES = [0, 1, 2];

function Game({player, game}) {
  const {board, player1, player2, winner} = game;
  const [localBoard, setBoard] = useState(board);
  const marker = player === player1 ? 'X' : 'O';

  const move = async (row, column) => {
    if (winner) return;

    try {
      localBoard[row][column] = marker;
      /*
      const res = await postJson('move', {gameId: id, row, column, marker});
      if (res.ok) {
        setBoard([...localBoard]);
      } else {
        alert(await res.text());
      }
      */
      const text = transact('move', {
        host: player1,
        challenger: player2,
        row,
        column,
        by: player
      });
      if (text) {
        alert(text);
      } else {
        setBoard([...localBoard]);
      }
    } catch (e) {
      alert(`Error making move: ${e.message}`);
    }
  };

  let className = 'game';
  if (winner) className += ' over';

  return (
    <div className={className}>
      <header>
        {player1} vs. {player2}
        {winner && <div>{winner} won!</div>}
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

Game.propTypes = {
  game: shape({
    id: string.isRequired,
    winner: string
  }).isRequired,
  player: string.isRequired
};

export default Game;
