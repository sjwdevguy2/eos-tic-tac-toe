# EOS Tic-Tac-Toe

## To start the server

```bash
cd server
npm run start
```

## To start the client

```bash
cd ..
npm run start
```

## Steps to Integrate Use of EOS Blockchain

```bash
npm install eosjs@v20.0.0-beta3
```

In `App.js`, add

```js
import {Api, JsonRpc, RpcError} from 'eosjs';
import {JsSignatureProvider} from 'eosjs/dist/eosjs-jssig';
```
