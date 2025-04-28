import React, { Component } from 'react';

class ViewText extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lines: [], // Store lines of extracted text for manual selection
      selectedLines: [], // Store indices of selected lines for manual chunking
      chunks: [], // Store text chunks (either auto or manual)
      chunkMode: 'auto', // 'auto' or 'manual'
      maxChars: 6000, // Max characters per chunk (approx 8192 tokens)
      minChars: 500, // Min characters per chunk
      minWords: 50, // Min words per chunk
    };
  }

  // Update state when extractedText changes
  componentDidUpdate(prevProps) {
    if (prevProps.extractedText !== this.props.extractedText) {
      this.updateText(this.props.extractedText);
    }
  }

  // Update lines and chunks based on extracted text
  updateText = (text) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const chunks = this.chunkTextAuto(text);

    this.setState({
      lines: lines,
      selectedLines: [],
      chunks: chunks,
      chunkMode: 'auto',
    }, () => {
      this.props.onChunksChange(chunks);
    });
  };

  // Automatic chunking with max/min character and word limits
  chunkTextAuto = (text) => {
    const { maxChars, minChars, minWords } = this.state;
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const chunks = [];
    let currentChunk = '';
    let currentWords = 0;

    for (const line of lines) {
      const lineWords = line.split(/\s+/).filter(word => word.length > 0).length;
      const potentialChunk = currentChunk ? currentChunk + '\n' + line : line;
      const potentialLength = potentialChunk.length;
      const potentialWords = currentWords + lineWords;

      if (potentialLength > maxChars) {
        if (currentChunk.length >= minChars && currentWords >= minWords) {
          chunks.push('search_document: ' + currentChunk);
          currentChunk = line;
          currentWords = lineWords;
        } else {
          currentChunk = potentialChunk;
          currentWords = potentialWords;
        }
      } else {
        currentChunk = potentialChunk;
        currentWords = potentialWords;
      }
    }

    if (currentChunk) {
      if (currentChunk.length < minChars || currentWords < minWords) {
        if (chunks.length > 0) {
          chunks[chunks.length - 1] = chunks[chunks.length - 1] + '\n' + currentChunk;
        } else {
          chunks.push('search_document: ' + currentChunk);
        }
      } else {
        chunks.push('search_document: ' + currentChunk);
      }
    }

    return chunks;
  };

  // Manual chunking based on selected lines
  chunkTextManual = () => {
    const { lines, selectedLines } = this.state;
    if (selectedLines.length === 0) return [];

    const sortedIndices = [...selectedLines].sort((a, b) => a - b);
    const chunks = [];
    let currentChunk = [];
    let lastIndex = -1;

    for (const index of sortedIndices) {
      if (lastIndex === -1 || index === lastIndex + 1) {
        currentChunk.push(lines[index]);
      } else {
        if (currentChunk.length > 0) {
          chunks.push('search_document: ' + currentChunk.join('\n'));
        }
        currentChunk = [lines[index]];
      }
      lastIndex = index;
    }

    if (currentChunk.length > 0) {
      chunks.push('search_document: ' + currentChunk.join('\n'));
    }

    return chunks;
  };

  // Handle line selection for manual chunking
  toggleLineSelection = (index) => {
    this.setState((prevState) => {
      const selectedLines = prevState.selectedLines.includes(index)
        ? prevState.selectedLines.filter(i => i !== index)
        : [...prevState.selectedLines, index];
      return { selectedLines };
    });
  };

  // Switch to manual chunking mode and update chunks
  applyManualChunks = () => {
    const chunks = this.chunkTextManual();
    this.setState({ chunks, chunkMode: 'manual' }, () => {
      this.props.onChunksChange(chunks);
    });
  };

  // Switch back to auto chunking mode
  resetToAutoChunks = () => {
    const chunks = this.chunkTextAuto(this.props.extractedText);
    this.setState({ chunks, selectedLines: [], chunkMode: 'auto' }, () => {
      this.props.onChunksChange(chunks);
    });
  };

  // Handle changes to chunking parameters
  handleChunkParamChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = parseInt(value, 10);
    if (isNaN(parsedValue) || parsedValue < 0) return;

    this.setState({ [name]: parsedValue }, () => {
      if (this.state.chunkMode === 'auto') {
        this.resetToAutoChunks();
      }
    });
  };

  render() {
    const { extractedText } = this.props;
    const { lines, selectedLines, chunkMode, chunks, maxChars, minChars, minWords } = this.state;
    return (
      <div>
        <h2 className="subtitle">Extracted Text</h2>
        <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' }}>
          {extractedText || 'No text extracted yet.'}
        </pre>

        <h2 className="subtitle">Chunking Mode</h2>
        <div className="field has-addons">
          <p className="control">
            <button
              className={`button ${chunkMode === 'auto' ? 'is-primary' : 'is-light'}`}
              onClick={this.resetToAutoChunks}
            >
              Auto Chunking
            </button>
          </p>
          <p className="control">
            <button
              className={`button ${chunkMode === 'manual' ? 'is-primary' : 'is-light'}`}
              onClick={() => this.setState({ chunkMode: 'manual' })}
            >
              Manual Chunking
            </button>
          </p>
        </div>

        {chunkMode === 'auto' && (
          <div className="mb-4">
            <h3 className="subtitle">Auto Chunking Settings</h3>
            <div className="field">
              <label className="label">Max Characters per Chunk</label>
              <div className="control">
                <input
                  className="input"
                  type="number"
                  name="maxChars"
                  value={maxChars}
                  onChange={this.handleChunkParamChange}
                  min="1"
                />
              </div>
            </div>
            <div className="field">
              <label className="label">Min Characters per Chunk</label>
              <div className="control">
                <input
                  className="input"
                  type="number"
                  name="minChars"
                  value={minChars}
                  onChange={this.handleChunkParamChange}
                  min="1"
                />
              </div>
            </div>
            <div className="field">
              <label className="label">Min Words per Chunk</label>
              <div className="control">
                <input
                  className="input"
                  type="number"
                  name="minWords"
                  value={minWords}
                  onChange={this.handleChunkParamChange}
                  min="1"
                />
              </div>
            </div>
          </div>
        )}

        {chunkMode === 'manual' && (
          <div>
            <h3 className="subtitle">Select Lines to Chunk</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #dbdbdb', padding: '10px' }}>
              {lines.map((line, index) => (
                <div key={index} className="field">
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={selectedLines.includes(index)}
                      onChange={() => this.toggleLineSelection(index)}
                    />
                    {' '}{line}
                  </label>
                </div>
              ))}
            </div>
            <button
              className="button is-primary mt-2"
              onClick={this.applyManualChunks}
              disabled={selectedLines.length === 0}
            >
              Apply Manual Chunks
            </button>
          </div>
        )}

        <h2 className="subtitle">Text Chunks for Embedding ({chunkMode} mode)</h2>
        {chunks.length === 0 ? (
          <p>No chunks created yet.</p>
        ) : (
          <ul>
            {chunks.map((chunk, index) => (
              <li key={index}>
                <strong>Chunk {index + 1}:</strong>
                <pre style={{ whiteSpace: 'pre-wrap' }}>{chunk}</pre>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
}

export default ViewText;