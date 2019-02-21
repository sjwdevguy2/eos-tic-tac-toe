import {Api, JsonRpc, RpcError} from 'eosjs';
import JsSignatureProvider from 'eosjs/dist/eosjs-jssig';

const ACCOUNT = 'tic.tac.toe';
const HOST = 'http://oci1668:48888';

export function getEosApi() {
  const defaultPrivateKey =
    '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3';
  const signatureProvider = new JsSignatureProvider([defaultPrivateKey]);
  const rpc = new JsonRpc(HOST, {fetch});
  const api = new Api({
    rpc,
    signatureProvider,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder()
  });
  return api;
}

const eosApi = getEosApi();

export async function transact(actionName, data) {
  console.log('eos-util.js transact: actionName =', actionName);
  console.log('eos-util.js transact: data =', data);
  const action = {
    account: ACCOUNT,
    name: actionName,
    authorization: [
      {
        actor: ACCOUNT,
        permission: 'active'
      }
    ],
    data: {...data, host: HOST}
  };
  console.log('eos-util.js transact: action =', action);

  try {
    const result = await eosApi.transact(
      {actions: [action]},
      {blocksBehind: 3, expireSeconds: 30}
    );
    console.dir(result);
    return result;
  } catch (e) {
    console.error('transact error:', e.message);
    if (e instanceof RpcError) {
      console.error(JSON.stringify(e.json, null, 2));
    }
  }
}
