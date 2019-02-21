import {useEffect, useState} from 'react';

const SERVER_URL = 'http://localhost:1919/';
const options = {};

export async function getJson(urlSuffix) {
  const url = SERVER_URL + urlSuffix;
  const res = await fetch(url, options);
  return res.json();
}

export async function getText(urlSuffix) {
  const url = SERVER_URL + urlSuffix;
  const res = await fetch(url, options);
  return res.text();
}

export async function postJson(urlSuffix, obj) {
  const body = JSON.stringify(obj);
  const headers = {'Content-Type': 'application/json'};
  const url = SERVER_URL + urlSuffix;
  const res = await fetch(url, {...options, method: 'POST', headers, body});
  return res;
}

export function useFetchState(urlSuffix, initialValue) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    getJson(urlSuffix)
      .then(setValue)
      .catch(e => console.warn(e));
  }, [urlSuffix]);

  return [value, setValue];
}
