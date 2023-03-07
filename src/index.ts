import '@material/mwc-button';

import {Emoji, fetchFromCDN} from 'emojibase';
import {LitElement, css, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {repeat} from 'lit/directives/repeat.js';

const zip = require('@zip.js/zip.js');

zip.configure({useWebWorkers: false});

const emojiVersion = Number(localStorage.getItem('emojiVersion')) || Infinity;
const emojiPromise = fetchFromCDN(`en/data.json`);

const DRAW_SIZE = 512;
const FONT_SIZE = DRAW_SIZE * 400 / 512;
const BASELINE = FONT_SIZE - 10;
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
  @property({type: Boolean, reflect: true}) vector = true;

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
      :host([vector]) :where(.current, .candidates) {
        font-family: "Noto Colr Emoji Glyf";
      }
      :host::-webkit-scrollbar {
        display: none;
      }
      pre {
        font-size: 2px;
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
  onInput(e: InputEvent) {
    const value = (e.target as HTMLInputElement).value;
    const matches = [{rank: 9999, emoji: this.current, annotation: ''}];
    for (const e of this.emojis) {
      const annotation = e.label;
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
    const family = this.vector ? '"Noto Colr Emoji Glyf"' : 'sans-serif';
    ctx.font = `${FONT_SIZE}px ${family}`;
    ctx.textAlign = 'center';
    ctx.fillText(this.current, canvas.width / 2, BASELINE);
    this.generate(e);
  }
  async generate(e: MouseEvent): Promise<void> {
    const source = this.renderRoot.querySelector('canvas')!;
    const icons: Record<string, Blob> = {};
    for (const s of DIMENSIONS) {
      const canvas = new OffscreenCanvas(s, s);
      const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
      ctx.drawImage(source, 0, 0, s, s);
      icons[s] = await canvas.convertToBlob({type: 'image/png'});
    }
    const zipFile = new zip.ZipWriter(new zip.BlobWriter());
    let iconManifest = '';
    for (const f of Object.keys(icons)) {
      console.log(`${f} is ${icons[f].size} bytes`);
      await zipFile.add(`icon-${f}x${f}.png`, new zip.BlobReader(icons[f]));
      if (iconManifest) iconManifest += ',';
      iconManifest += `
        {
          "src": "./icons/icon-${f}x${f}.png",
          "type": "image/png",
          "sizes": "${f}x${f}"
        }`;
    }
    console.log('Generating zip..');
    blobToDownload = await zipFile.close();
    const text = this.renderRoot.querySelector('pre')!;
    text.innerText = `{
      "name": "Emicon",
      "icons": [${iconManifest}
      ],
      "short_name": "Emicon",
      "theme_color": "#2196f3",
      "background_color": "#2196f3",
      "display": "fullscreen",
      "orientation": "portrait",
      "start_url": "index.html"
    }`;
    this.renderRoot.querySelector('#download')?.removeAttribute('disabled');
  }
  download(e: MouseEvent) {
    downloadBlob(blobToDownload, 'icons.zip');
  }
  render() {
    return html`
      <input
          placeholder="Search"
          type="text"
          value="avocado"
          @input=${this.onInput}>
      <label>
        <input type="checkbox" @change=${() => this.vector = !this.vector} checked>
        Vector Fonts
      </label>
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
      <pre>
      </pre>
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

document.addEventListener('DOMContentLoaded', (e) => {
  document.body.appendChild(container);
  firstFullLoad = initPages();
});

window.addEventListener('load', (e) => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js');
  }
});

export const unused = {
  customElement, property, firstFullLoad,
};
