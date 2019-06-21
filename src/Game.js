import React, {useState} from 'react';
import {postJson} from './fetch-util';
import PropTypes from 'prop-types';
import './Game.css';

const INDEXES = [0, 1, 2];

// Eliminate eslint error "Component should be written as a pure function"  
// configure the game argument as required
Game.propTypes = {
  game: PropTypes.object.isRequired
};

function Game({game}) {
  const {board, id, /*player1, player2,*/ winner} = game;

  //console.info('game', game, 'player', player, 'player1', player1, 'player2', player2);

  const [localBoard, setBoard] = useState(board);
  const marker = getMoveCount(game.board) % 2 === 0  ? 'X' : 'O';

  const move = async (row, column, existingValue) => {
    if (winner || existingValue !== '') return;

    try {
      localBoard[row][column] = marker;
      //console.info('move','id',id,'row',row,'col',column,'marker',marker);
      
      const res = await postJson('move', {gameId: id, row, column, marker});
      if (res.ok) {
        setBoard([...localBoard]);
      } else {
        alert(await res.text());
      }
    } catch (e) {
      alert(`Error making move: ${e.message}`);
    }
  };

  let className = 'game';
  if (winner) className += ' over';

  return (
    <div className={className} align="center">
      <header align="center">
        {/* {player1} vs. {player2} */}

        {typeof winner !== 'undefined' && winner !== '' 
          ? <div align="center">Winner:<br/>{winner}<br/></div>
          : <div>Next move:&nbsp;{marker}<br/><br/></div>  }
      </header>      
      {INDEXES.map(row => (
        <div className="row" key={`row${row}`}>
          {INDEXES.map(column => (
            <div
              className="position"
              key={`column${column}`}
              onClick={() => move(row, column, board[row][column])}
            >
              {board[row][column]}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function getMoveCount(board){
  let moveCount = 0;
  board.forEach(x => {
    x.forEach(y => {
      if(y !== '' && y !== 'undefined')
        moveCount = moveCount + 1;
    });
  });
  return moveCount;
}

export default Game;
