import '@material/mwc-button';
import '@material/mwc-snackbar';

import {css, customElement, LitElement, property} from 'lit-element';
import {Emoji, fetchFromCDN} from 'emojibase';
import {html} from 'lit-html';
import {repeat} from 'lit-html/directives/repeat.js';
import * as JSZip from 'jszip';

const emojiVersion = Number(localStorage.getItem('emojiVersion')) || Infinity;
const emojiPromise = fetchFromCDN(`en/data.json`);

const DRAW_SIZE = 512;
const DIMENSIONS = [16, 32, 48, 72, 96, 120, 128, 144, 152, 180, 192, 384, 512];

let blobToDownload = new Blob([]);

function downloadBlob(blob: Blob, name = 'file.txt') {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}

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
      canvas {
        width: 200px;
        border: 1px solid black;
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
  onClickCandidate(e: MouseEvent) {
    const div = e.target as HTMLDivElement;
    this.current = div.textContent?.trim() || this.current;
    this.annotation = div.title;
  }
  draw(e: MouseEvent) {
    this.renderRoot.querySelector('#download')?.toggleAttribute('disabled', true);
    const canvas = this.renderRoot.querySelector('canvas')!;
    const ctx = canvas?.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '400px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.current, canvas.width/2, 390);
    this.generate(e);
  }
  async generate(e: MouseEvent): Promise<void> {
    const source = this.renderRoot.querySelector('canvas')!;
    const icons = [] as Blob[];
    for (const s of DIMENSIONS) {
      const canvas = new OffscreenCanvas(s, s);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(source, 0, 0, s, s);
      icons[s] = await canvas.convertToBlob({type: 'image/png'});
    }
    const zip = new JSZip();
    for (const f in icons) {
      console.log(`${f} is ${icons[f].size} bytes`);
      zip.file(`icon-${f}x${f}.png`, icons[f]);
    }
    console.log('Generating zip..');
    zip.generateAsync({type : 'blob', compression: 'DEFLATE'}).then(blob => {
      console.log('done!');
      blobToDownload = blob;
      this.renderRoot.querySelector('#download')?.removeAttribute('disabled');
    });
  }
  download(e:MouseEvent) {
    downloadBlob(blobToDownload, 'icons.zip');
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
      <button @click=${this.draw}>Draw</button>
      <button
          id="download"
          @click=${this.download}
          disabled>
        Download
      </button>
      <canvas width="${DRAW_SIZE}" height="${DRAW_SIZE}"></canvas>
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
