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

function lastIndexOfRegex(re, str, limit) {
	let last = -1;
	let match;
	while ((match = re.exec(str)) != null) {
		if (match.index >= limit) {
			break;
		}
		last = match.index;
	}
	return last;
}

const INVIS_SPACE = '‎';
const INITIAL_VALUE = load();

export class MessageChunkerApp extends LitElement {
	static properties = {
		_chunks: {state: true},
		_copyCursor: {state: true},
	};

	static styles = css`
		textarea {
			width: 100%;
			resize: vertical;
		}

		message-chunk {
			border-block-start: 1px solid gray;
			display: block;
		}
		message-chunk.highlight {
			background: rgba(255, 255, 255, 0.1);
		}

		section#chunk-controls {
			margin-block: 1rem;
		}
		section#chunk-controls div {
			margin-block: 0.5rem;
			display: flex;
			gap: 0.5rem;
		}
		section#chunk-controls div * {
			flex: 1 0 0;
		}
		button {
			padding-block: 0.25rem;
		}
	`;

	constructor() {
		super();
		this._chunks = [];
		if (INITIAL_VALUE) {
			this._computeChunks(INITIAL_VALUE);
		}
		this._resetCopyCursor();
	}

	_resetCopyCursor() {
		this._copyCursor = undefined;
	}

	_onTextareaUpdated(e) {
		let raw = e.target.value;
		this._computeChunks(raw);
		this._onExpandAllClicked();
	}

	_computeChunks(raw) {
		save(raw);

		this._chunks = [];
		if (raw.length < 2000) {
			this._chunks.push(raw);
		}
		else {
			while (raw.length > 2000) {
				let splitIdx = lastIndexOfRegex(/\n{2,}/g, raw, 2000);
				if (splitIdx === -1) {
					splitIdx = lastIndexOfRegex(/\n/g, raw, 2000);
				}
				if (splitIdx === -1) {
					splitIdx = lastIndexOfRegex(/\. /g, raw, 2000) + 1;
				}
				if (splitIdx === -1) {
					splitIdx = lastIndexOfRegex(/\s+/g, raw, 2000);
				}
				this._chunks.push(raw.substring(0, splitIdx).trimEnd());
				raw = raw.substring(splitIdx).trimStart();
			}
			this._chunks.push(raw);
		}

		this._resetCopyCursor();
	}

	_findAllChunkChildren() {
		return this.renderRoot.querySelectorAll('message-chunk');
	}

	_onExpandAllClicked() {
		const children = this._findAllChunkChildren();
		children.forEach(child => {
			child._collapsed = false;
		});

		this._resetCopyCursor();
	}
	_onCollapseAllClicked() {
		const children = this._findAllChunkChildren();
		children.forEach(child => {
			child._collapsed = true;
		});

		this._resetCopyCursor();
	}

	_onCopyNextClicked() {
		const children = this._findAllChunkChildren();

		// Collapse children before the copy-cursor
		// if (this._copyCursor !== undefined) {
		// 	for (let index = 0; index <= this._copyCursor; index++) {
		// 		const child = children[index];
		// 		child._collapsed = true;
		// 	}
		// }

		// Exit early if copy-cursor is on last element
		if (this._copyCursor >= (children.length - 1)) {
			this._resetCopyCursor();
			return;
		}

		// Increment copy-cursor
		if (this._copyCursor === undefined) {
			this._copyCursor = 0;
		}
		else {
			this._copyCursor++;
		}

		// Copy next
		children[this._copyCursor]._onCopyButtonClicked(true);
	}

	_onMessageChunkCopyClicked(idx) {
		this._copyCursor = idx;
	}

	render() {
		return html`
			<textarea @input=${this._onTextareaUpdated} .value=${INITIAL_VALUE}></textarea>
			<hr/>
			<section id="chunk-controls">
				<div>
					<button @click=${this._onExpandAllClicked}>Expand all</button>
					<button @click=${this._onCollapseAllClicked}>Collapse all</button>
				</div>
				<div>
					<button @click=${this._onCopyNextClicked}>Copy next</button>
				</div>
			</section>
			<section id="chunk-area">
				${this._chunks.map((chunk, idx) => html`
					<message-chunk
						class="${(this._copyCursor === idx) && 'highlight'}"
						.value=${chunk}
						?trailing-newline=${idx < (this._chunks.length - 1)}
						key=${idx}
						@copied=${() => this._onMessageChunkCopyClicked(idx)}
					></message-chunk>
				`)}
			</section>
		`;
	}
}
customElements.define('message-chunker-app', MessageChunkerApp);

export class MessageChunk extends LitElement {
	// Define scoped styles right with your component, in plain CSS
	static styles = css`
		:host {
			padding: 1rem;
		}
		div.hidden {
			display: none;
		}
		pre {
			white-space: pre-wrap;
		}
	`;

	static properties = {
		_collapsed: {state: true},
		value: {},
		trailingNewline: {attribute: 'trailing-newline', type: Boolean, default: false},
	};

	constructor() {
		super();
		this._collapsed = false;
	}

	_onCollapseButtonClicked() {
		this._collapsed = !this._collapsed;
	}

	_onCopyButtonClicked(omitEvent) {
		omitEvent ??= false;

		let content = this.value;
		if (this.trailingNewline) {
			content = `${content}\n${INVIS_SPACE}`;
		}
		navigator.clipboard.writeText(content);

		if (omitEvent) return;

		const event = new CustomEvent('copied', {detail: { content }, bubbles: true, composed: true})
		this.dispatchEvent(event);
	}

	render() {
		return html`
			<button @click=${this._onCollapseButtonClicked}>${this._collapsed ? '>' : 'v'}</button>
			<div class="${this._collapsed && 'hidden'}">
				<button @click=${() => this._onCopyButtonClicked()}>Copy</button>
				<pre>${this.value}</pre>
			</div>
		`;
	}
}
customElements.define('message-chunk', MessageChunk);