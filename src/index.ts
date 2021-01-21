import '@material/mwc-button';
import '@material/mwc-snackbar';

import {css, customElement, LitElement, property} from 'lit-element';
import {html} from 'lit-html';
import {repeat} from 'lit-html/directives/repeat.js';
import {Snackbar} from '@material/mwc-snackbar';

@customElement('e-container')
class EContainer extends LitElement {
  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: row;
        height: 90vh;
        overflow-x: scroll;
        overflow-y: hidden;
        width: 100vw;
      }
      :host::-webkit-scrollbar {
        display: none;
      }
      `;
  }
  onSnackbarClosing(e: CustomEvent) {
    if (resumePage && e.detail.reason === 'action') {
      enableAudio = enableAudio || localStorage.getItem('audio') === 'true';
      resumePage.doScroll();
    }
  }
  render() {
    return html`
      <mwc-snackbar
          timeoutMs="-1"
          @MDCSnackbar:closing=${this.onSnackbarClosing}>
        <mwc-button slot="action">RESUME</mwc-button>
        <mwc-button slot="dismiss">✖️</mwc-button>
      </mwc-snackbar>
    `;
  }
}

const container = new EContainer();

async function initPages() {
  await container.updateComplete;
}

document.addEventListener('DOMContentLoaded', (e)=> {
  document.body.appendChild(container);
  firstFullLoad = initPages();
});

window.addEventListener('load', (e) => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js');
  }
});
