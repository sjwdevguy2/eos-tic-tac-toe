/* global dialogPolyfill: false */
import React, {useEffect, useState} from 'react';

let dialog, setMessage;

const formStyle = {
  display: 'flex',
  justifyContent: 'center',
  marginTop: '10px'
};

window.alert = message => {
  if (dialog) {
    setMessage(message);
    dialog.showModal();
  }
};

export default function Dialog() {
  const [message, setMsg] = useState('');
  setMessage = setMsg;

  useEffect(() => {
    dialog = document.querySelector('.react-dialog');

    // Register the dialog with the polyfill which is
    // required by browsers that lack native support.
    dialogPolyfill.registerDialog(dialog);
  }, []);

  return (
    <dialog className="react-dialog">
      {message}
      <form method="dialog" style={formStyle}>
        <input type="submit" value="Close" />
      </form>
    </dialog>
  );
}
