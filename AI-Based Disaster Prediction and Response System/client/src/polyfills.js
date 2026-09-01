// Polyfill crypto.randomUUID for insecure (http://) contexts.
// randomUUID only exists in secure contexts (https or localhost). When the app
// is served over plain http (e.g. http://52.66.14.184), window.crypto.randomUUID
// is undefined, which crashes any dependency that calls it internally.
// This file is imported first in index.js so the polyfill runs before anything else.
if (typeof window !== 'undefined' && window.crypto) {
  if (typeof window.crypto.randomUUID !== 'function') {
    window.crypto.randomUUID = function randomUUID() {
      return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
        (
          c ^
          (window.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
        ).toString(16)
      );
    };
  }
}
