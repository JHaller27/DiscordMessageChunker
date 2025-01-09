import {LitElement, css, html} from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

export class MessageChunkerApp extends LitElement {
	static properties = {
		_chunks: {state: true}
	};

	static styles = css`
		textarea {
			width: 100%;
		}
	`;

	constructor() {
		super();
		this._chunks = [];
	}

	_updateChunks(e) {
		let raw = e.target.value;
		const chunks = raw.split('\n\n');
		this._chunks = chunks;
	}

	render() {
		return html`
			<textarea @input=${this._updateChunks}></textarea>
			<hr/>
			<section>
				${this._chunks.map(chunk => html`
						<message-chunk>${chunk}</message-chunk>
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
		}
	`;

	render() {
		return html`
			<div>
				<slot>
			</div>
		`;
	}
}
customElements.define('message-chunk', MessageChunk);