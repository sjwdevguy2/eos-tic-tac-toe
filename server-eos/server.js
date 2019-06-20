// import { Api, JsonRpc, RpcError } from 'eosjs';

const PORT = 1919;

const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const WebSocket = require('ws');

// eosjs blockchain server connection info
const eosjsUrl = 'http://OCI1668.objectcomputing.com:48888';
const defaultPrivateKey = "5JtUScZK2XEp3g9gh7F8bwtPTRAkASmNrrftmx4AxDKD5K4zDnr";
const contract = 'tic.tac.toe';
// 2 active accounts
// 1) tttplayerxxx
// 2) tttplayerooo

// Additional require statements (for eosjs)
const { Api, JsonRpc, RpcError } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');      // development only
const fetch = require('node-fetch');                                    // node only; not needed in browsers
const { TextEncoder, TextDecoder } = require('util');                   // node only; native TextEncoder/Decoder
//const { TextEncoder, TextDecoder } = require('text-encoding');        // React Native, IE11, and Edge Browsers only

const INDEXES = [0, 1, 2];

let webSockets = [];
const wss = new WebSocket.Server({port: 1920});
wss.on('connection', ws => webSockets.push(ws));

const app = express();
app.use(cors());
app.use(morgan('short'));
app.use(express.static(path.resolve(__dirname, '../dist')));
app.use(bodyParser.json({limit: '4mb'}));

function getMoveCount(board){
  let moveCount = 0;
  board.forEach(x => {
    x.forEach(y => {
      if(y !== '' && y !== 'undefined')
        moveCount = moveCount + 1;
      //console.info('y',y);
    });
  });
  return moveCount;
}

function convertChoiceForDisplay(intVal) {
  let newValue = '';
  switch(intVal){
    case 0: newValue = ''; break;
    case 1: newValue = 'X'; break;
    case 2: newValue = 'O'; break;
  }
  return newValue;
}

app.get('/heartbeat', async (req, res) => {
    res.send('I am alive!');
  });

// app.get('/games/:userId', async (req, res) => {
//   const {dashArg} = req.params;
//   const p1 = dashArg !== 'undefined' ? dashArg.split('-')[0] : '';
//   const p2 = dashArg !== 'undefined' ? dashArg.split('-')[1] : '';

//     const gamesForUser = Object.values(gameMap).reduce((acc, game) => {
//       if (game.player1 === p1 && game.player2 === p2)  
//         acc[game.id] = game;
//       return acc;
//     }, {});

//     res.set('Content-Type', 'application/json');
//     res.send(gamesForUser);
// });

app.post('/game', async (req, res) => {
    const {player1, player2} = req.body;
    if (!player1 || !player2)
        return res.status(400).send('player names not supplied');

    let game = await eosjsLoadOrCreateGame(player1, player2);
    if (game !== null && (game.winner != '' || getMoveCount(game.board) > 0)) {
      
      // Restart existing game
      game = await eosjsTransaction(
        player1, 
        'restart', 
        {
          // <fields> properties from *.abi file 
          host: player1,
          challenger: player2,
          by: player1
        });
      
      game = await eosjsLoadOrCreateGame(player1, player2);
    } 

    res.send(JSON.stringify(game));
});

app.post('/move', async (req, res) => {
  const {gameId, row, column, marker} = req.body;

  const player1 = gameId.split('|')[0];
  const player2 =  gameId.split('|')[1];
  const by = (marker === 'X') ? player1 : player2;

  // execute a move transaction
  await eosjsTransaction(
    by, 
    'move', 
    {
      // <fields> properties from *.abi file 
      host: player1,
      challenger: player2,
      by: by,
      row: row,
      column: column
    });
  const resultGame = await eosjsLoadOrCreateGame(player1, player2);
  res.send(resultGame.winner);

  // Remove any WebSockets that are closing or closed.
  webSockets = webSockets.filter(ws => ws.readyState <= 1);

  // Notify all the connected clients about this move.
  const data = JSON.stringify({gameId, row, column, marker, winner: resultGame.winner});
  try {
    webSockets.forEach(ws => ws.send(data));
  } catch (e) {
    console.error(e);
  }
});

// async function sleep (time) {
//   return await new Promise((resolve) => setTimeout(resolve, time));
// }

// execute a transaction
async function eosjsTransaction(actor, actionName, data){
  //------------------------------------------
  // following is from the github readme
  // https://github.com/eosio/eosjs#npm

  // const rpc = new JsonRpc('http://OCI1668:48888', { fetch });
  const rpc = new JsonRpc(eosjsUrl, { fetch });

  const signatureProvider = new JsSignatureProvider([defaultPrivateKey]);
  const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

  try {
    const result = await api.transact({
      actions: [{
        account: contract,
        name: actionName, //(close/create/game/move/restart)
        authorization: [{
          actor: actor, // (host - get from phil - implementation dependant)
          permission: 'active',
        }],
        // values from the *.abi file
        data: data,
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30,
    });

    // print out only the interesting response action data
    if ('processed' in result
     && 'action_traces' in result.processed
     && 'act' in result.processed.action_traces[0]) {
      console.info(
        'eosjsTransaction(' + actionName + ')\n\t >> ', 
        JSON.stringify(result.processed.action_traces[0].act));
    }

    return result;
  } catch (e) {
    console.log('\nCaught exception: ' + e);
    if (e instanceof RpcError)
      console.log(JSON.stringify(e.json, null, 2));
  }
  return null;
}

// get all games for the given users
async function eosjsLoadOrCreateGame(host, challenger){

  const rpc = new JsonRpc(eosjsUrl, { fetch });

  try {
    const resp = await rpc.get_table_rows({
        json: true,            // Get the response as json
        code: contract,        // Contract that we target
        scope: host,           // Account that owns the data (hostname: player1)
        table: 'games',        // Table name
        limit: 10,             // Maximum number of rows that we want to get
        reverse: false,        // Optional: Get reversed data
        show_payer: false,     // Optional: Show ram payer
    });

    console.info('get_table_rows\n\t >> ', JSON.stringify(resp));
    
    let gameRows = resp.rows.filter(x => x.challenger === challenger);
    if (gameRows.length === 0)
    {
      // no games found - execute a create game transaction
      gameRows = await eosjsTransaction(
        host, 
        'create', 
        {
          // <fields> properties from *.abi file 
          host: host,
          challenger: challenger
        });
      gameRows = resp.rows.filter(x => x.challenger === challenger);
    }

    const game = {
      id: gameRows[0].host + '|' + gameRows[0].challenger, 
      player1: gameRows[0].host, 
      player2: gameRows[0].challenger, 
      winner: gameRows[0].winner === 'none' ? '' : gameRows[0].winner,
      board: [
        [convertChoiceForDisplay(gameRows[0].board[0]), convertChoiceForDisplay(gameRows[0].board[1]), convertChoiceForDisplay(gameRows[0].board[2]) ],
        [convertChoiceForDisplay(gameRows[0].board[3]), convertChoiceForDisplay(gameRows[0].board[4]), convertChoiceForDisplay(gameRows[0].board[5]) ],
        [convertChoiceForDisplay(gameRows[0].board[6]), convertChoiceForDisplay(gameRows[0].board[7]), convertChoiceForDisplay(gameRows[0].board[8]) ],
      ]
    };
    return game;

  } catch (e) {
    console.log('\nCaught exception: ' + e);
    if (e instanceof RpcError)
      console.log(JSON.stringify(e.json, null, 2));
      return null;
  }
}

app.listen(PORT, () => console.info('listening on port', PORT));

