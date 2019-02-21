import {Api, JsonRpc, RpcError} from 'eosjs';
import {JsSignatureProvider} from 'eosjs/dist/eosjs-jssig';

const HOST = 'eos-host-name';
const TOKEN = 'eosio-token';
const USER_ID = 'user-id';

const eosApi = getEosApi();
console.log('App.js x: eosApi =', eosApi);

export function getEosApi() {
  const defaultPrivateKey =
    '5JtUScZK2XEp3g9gh7F8bwtPTRAkASmNrrftmx4AxDKD5K4zDnr'; // bob
  const signatureProvider = new JsSignatureProvider([defaultPrivateKey]);
  const rpc = new JsonRpc('http://127.0.0.1:8888', {fetch});
  const api = new Api({
    rpc,
    signatureProvider,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder()
  });
  return api;
}

export async function transact(actionName, data) {
  const action = {
    account: TOKEN,
    name: `tic.tac.toe ${actionName}`,
    authorization: [
      {
        actor: USER_ID,
        permission: 'active'
      }
    ],
    data: {...data, host: HOST}
  };
  const result = await eosApi.transact(
    {actions: [action]},
    {blocksBehind: 3, expireSeconds: 30}
  );
  console.dir(result);
  return result;
}
