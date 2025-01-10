import {LitElement, css, html} from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

const STORE_KEY = 'message-chunker-app';
function save(text) {
	if (!text || text === '') {
		localStorage.removeItem(`${STORE_KEY}:version`);
		localStorage.removeItem(`${STORE_KEY}:data`);
		return;
	}

	localStorage.setItem(`${STORE_KEY}:version`, '0.0.1');
	localStorage.setItem(`${STORE_KEY}:data`, text);
}
function load() {
	const version = localStorage.getItem(`${STORE_KEY}:version`);
	if (!version) return null;

	if (version.startsWith('0.0')) {
		return localStorage.getItem(`${STORE_KEY}:data`);
	}

	return null;
}

const INVIS_SPACE = '‎';
const INITIAL_VALUE = load();

export class MessageChunkerApp extends LitElement {
	static properties = {
		_chunks: {state: true}
	};

	static styles = css`
		textarea {
			width: 100%;
			resize: vertical;
		}
		message-chunk {
			border-block-end: 1px solid gray;
			display: block;
		}
	`;

	constructor() {
		super();
		this._chunks = [];
		if (INITIAL_VALUE) {
			this._computeChunks(INITIAL_VALUE);
		}
	}

	_onTextareaUpdated(e) {
		let raw = e.target.value;
		this._computeChunks(raw);
	}

	_computeChunks(raw) {
		const chunks = raw.split(/\n{2,}/);
		this._chunks = chunks;
		save(raw);
	}

	render() {
		return html`
			<textarea @input=${this._onTextareaUpdated} .value=${INITIAL_VALUE}></textarea>
			<hr/>
			<section>
				${this._chunks.map((chunk, idx) => html`
					<message-chunk .value=${chunk} key=${idx} ?trailing-newline=${idx < (this._chunks.length - 1)}></message-chunk>
				`)}
			</section>
		`;
	}
}
customElements.define('message-chunker-app', MessageChunkerApp);

export class MessageChunk extends LitElement {
	// Define scoped styles right with your component, in plain CSS
	static styles = css`
		div.hidden {
			display: none;
		}
	`;

	static properties = {
		_collapsed: {state: true},
		value: {},
		trailingNewline: {name: 'trailing-newline', default: false},
	};

	constructor() {
		super();
		this._collapsed = false;
	}

	_onCollapseButtonClicked(e) {
		this._collapsed = !this._collapsed;
	}

	_onCopyButtonClicked(e) {
		let content = this.value;
		if (this.trailingNewline) {
			content = `${content}\n${INVIS_SPACE}`;
		}
		navigator.clipboard.writeText(content);
	}

	render() {
		return html`
			<button @click=${this._onCollapseButtonClicked}>${this._collapsed ? '>' : 'v'}</button>
			<div class="${this._collapsed && 'hidden'}">
				<button @click=${this._onCopyButtonClicked}>Copy</button>
				<pre>${this.value}</pre>
			</div>
		`;
	}
}
customElements.define('message-chunk', MessageChunk);