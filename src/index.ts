import '@material/mwc-button';
import '@material/mwc-snackbar';

import {css, customElement, LitElement, property} from 'lit-element';
import {Emoji, fetchFromCDN} from 'emojibase';
import {html} from 'lit-html';
import {repeat} from 'lit-html/directives/repeat.js';

const emojiVersion = Number(localStorage.getItem('emojiVersion')) || Infinity;
const emojiPromise = fetchFromCDN(`en/data.json`);

@customElement('e-container')
class EContainer extends LitElement {
  @property({attribute: false}) emojis: Emoji[] = [];
  @property({attribute: false}) current = '🥑';
  @property({attribute: false}) annotation = 'avocado';
  @property({attribute: false}) candidates =
      [{rank: 9999, emoji: this.current, annotation: this.annotation}];

  static get styles() {
    return css`
      :host {
        align-items: center;
        display: flex;
        flex-direction: column;
        height: 90vh;
        overflow-x: scroll;
        overflow-y: hidden;
        width: 100vw;
      }
      :host::-webkit-scrollbar {
        display: none;
      }
      .current {
        font-size: 10em;
      }
      .candidates {
        align-items: unset;
        flex-direction: row;
        display; flex;
        overflow-y: scroll;
      }
      .candidate {
        cursor: arrow;
      }
      `;
  }
  onSnackbarClosing(e: CustomEvent) {
    if (e.detail.reason === 'action') {
      console.log('Snackbar action');
    }
  }
  onInput(e: InputEvent) {
    const value = (e.target as HTMLInputElement).value;
    const matches = [{rank: 9999, emoji: this.current, annotation: ''}];
    for (const e of this.emojis) {
      const annotation = e.annotation;
      const rank = annotation.indexOf(value);
      const emoji = e.emoji;
      if (rank >= 0) {
        matches.push({rank, emoji, annotation});
      }
    }
    matches.sort((a, b) => a.rank - b.rank);
    this.candidates = matches;
    this.current = matches[0].emoji;
    this.annotation = matches[0].annotation;
  }
  onClickCandidate(e: InputEvent) {
    const div = e.target as HTMLDivElement;
    this.current = div.textContent?.trim() || this.current;
    this.annotation = div.title;
  }
  render() {
    return html`
      <input
          placeholder="Search"
          type="text"
          value="avocado"
          @input=${this.onInput}>
      <div class="current">
        ${this.current}
      </div>
      <div>${this.annotation}</div>
      <div class="candidates">
        ${repeat(this.candidates, (e) => e.emoji, (e) => html`
        <span
            class="candidate"
            @click=${this.onClickCandidate}
            title=${e.annotation}>
          ${e.emoji}
        </span>`)}
      </div>
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
let firstFullLoad = Promise.resolve();

async function initPages() {
  await container.updateComplete;
  const emojis = (await emojiPromise as Emoji[])
      .filter((e) => e.version <= emojiVersion);
  container.emojis = emojis;
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
