import React, { Component } from 'react';
import { withRouter } from './withRouter';
import mammoth from 'mammoth';
import { useDropzone } from 'react-dropzone';

// Functional component to use the useDropzone hook
const DropzoneWrapper = ({ onDrop }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
  });

  return (
    <div {...getRootProps()} className={`box ${isDragActive ? 'has-background-light' : ''}`}>
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the files here...</p>
      ) : (
        <p>Drag and drop .docx files here, or click to select files</p>
      )}
    </div>
  );
};

class Project extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: 'upload', // 'upload', 'view', or 'embed'
      files: [], // Store uploaded files for this project
      extractedText: '', // Store combined extracted text from all files
      lines: [], // Store lines of extracted text for manual selection
      selectedLines: [], // Store indices of selected lines for manual chunking
      chunks: [], // Store text chunks (either auto or manual)
      chunkMode: 'auto', // 'auto' or 'manual'
      maxChars: 6000, // Max characters per chunk (approx 8192 tokens)
      minChars: 500, // Min characters per chunk
      minWords: 50, // Min words per chunk
      chunkStatuses: [], // Store status of each chunk: { status: 'pending' | 'success' | 'failed', error: string, embedding: array }
      isEmbedding: false, // Track if embedding process is running
      selectedChunkIndex: null, // Track the chunk selected for the popup
      popupTab: 'text', // 'text' or 'embedding' for the popup
    };
  }

  // Handle tab switching
  handleTabChange = (tab) => {
    this.setState({ activeTab: tab });
  };

  // Handle file selection (both drag-and-drop and button click)
  onDrop = (acceptedFiles) => {
    const newFiles = [...this.state.files, ...acceptedFiles];
    this.setState({ files: newFiles }, () => {
      this.extractTextFromFiles(newFiles);
    });
  };

  // Extract text from Word documents
  extractTextFromFiles = async (files) => {
    let combinedText = '';
    for (const file of files) {
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        combinedText += result.value + '\n\n';
      }
    }

    // Split text into lines for manual selection
    const lines = combinedText.split('\n').filter(line => line.trim() !== '');

    // Automatically chunk the text
    const chunks = this.chunkTextAuto(combinedText);
    const chunkStatuses = chunks.map(() => ({ status: 'pending', error: '', embedding: null }));

    this.setState({
      extractedText: combinedText,
      lines: lines,
      selectedLines: [],
      chunks: chunks,
      chunkStatuses: chunkStatuses,
      chunkMode: 'auto',
      isEmbedding: false,
      selectedChunkIndex: null,
      popupTab: 'text',
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
    const chunkStatuses = chunks.map(() => ({ status: 'pending', error: '', embedding: null }));
    this.setState({
      chunks: chunks,
      chunkStatuses: chunkStatuses,
      chunkMode: 'manual',
      isEmbedding: false,
    });
  };

  // Switch back to auto chunking mode
  resetToAutoChunks = () => {
    const chunks = this.chunkTextAuto(this.state.extractedText);
    const chunkStatuses = chunks.map(() => ({ status: 'pending', error: '', embedding: null }));
    this.setState({
      chunks: chunks,
      chunkStatuses: chunkStatuses,
      selectedLines: [],
      chunkMode: 'auto',
      isEmbedding: false,
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

  // Send a single chunk to the backend for embedding
  embedSingleChunk = async (chunk, index) => {
    try {
      const response = await fetch('http://localhost:8000/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chunk }),
      });

      const data = await response.json();
      if (data.error) {
        this.setState((prevState) => {
          const newStatuses = [...prevState.chunkStatuses];
          newStatuses[index] = { status: 'failed', error: data.error, embedding: null };
          return { chunkStatuses: newStatuses };
        }, () => {
          this.forceUpdate();
        });
      } else {
        this.setState((prevState) => {
          const newStatuses = [...prevState.chunkStatuses];
          newStatuses[index] = { status: 'success', error: '', embedding: data.embedding };
          return { chunkStatuses: newStatuses };
        }, () => {
          this.forceUpdate();
        });
      }
    } catch (error) {
      this.setState((prevState) => {
        const newStatuses = [...prevState.chunkStatuses];
        newStatuses[index] = { status: 'failed', error: error.message, embedding: null };
        return { chunkStatuses: newStatuses };
      }, () => {
        this.forceUpdate();
      });
    }
  };

  // Embed all chunks asynchronously, one at a time
  embedChunks = async () => {
    const { chunks } = this.state;
    if (chunks.length === 0) {
      alert('No chunks to embed. Please upload documents first.');
      return;
    }

    this.setState({ isEmbedding: true }, async () => {
      for (let i = 0; i < chunks.length; i++) {
        const { isEmbedding } = this.state;
        if (!isEmbedding) {
          console.log('Embedding process aborted at chunk', i + 1);
          break;
        }
        await this.embedSingleChunk(chunks[i], i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      this.setState({ isEmbedding: false }, () => {
        console.log('Embedding process completed');
      });
    });
  };

  // Stop the embedding process
  stopEmbedding = () => {
    this.setState({ isEmbedding: false });
  };

  // Open the popup for a chunk
  openChunkPopup = (index) => {
    this.setState({ selectedChunkIndex: index, popupTab: 'text' });
  };

  // Close the popup
  closeChunkPopup = () => {
    this.setState({ selectedChunkIndex: null, popupTab: 'text' });
  };

  // Handle popup tab switching
  handlePopupTabChange = (tab) => {
    this.setState({ popupTab: tab });
  };

  // Render file list
  renderFileList = () => {
    const { files } = this.state;
    return (
      <ul>
        {files.map((file, index) => (
          <li key={index}>{file.name}</li>
        ))}
      </ul>
    );
  };

  // Render extracted text with manual selection
  renderExtractedText = () => {
    const { extractedText, lines, selectedLines, chunkMode, chunks, maxChars, minChars, minWords } = this.state;
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
  };

  // Render embedding results in a dynamic grid
  renderEmbeddingResults = () => {
    const { chunks, chunkStatuses, isEmbedding, selectedChunkIndex, popupTab } = this.state;
    return (
      <div>
        <h2 className="subtitle">Embed Chunks</h2>
        <div className="mb-4">
          <button
            className="button is-primary mr-2"
            onClick={this.embedChunks}
            disabled={isEmbedding || chunks.length === 0}
          >
            Auto Check All Chunks
          </button>
          {isEmbedding && (
            <button className="button is-danger" onClick={this.stopEmbedding}>
              Stop
            </button>
          )}
        </div>
        {chunks.length === 0 ? (
          <p>No chunks to embed. Please create chunks in the View Text tab.</p>
        ) : (
          <div className="columns is-multiline">
            {chunks.map((chunk, index) => {
              const status = chunkStatuses[index];
              const isPending = status.status === 'pending';
              const isSuccess = status.status === 'success';
              const isFailed = status.status === 'failed';
              const isProcessing = isPending && isEmbedding && index === chunkStatuses.findIndex(s => s.status === 'pending');
              return (
                <div key={index} className="column is-2">
                  <div
                    className={`box has-text-centered ${isSuccess ? 'has-background-success-light' : ''} ${isFailed ? 'has-background-danger-light' : ''}`}
                    style={{ cursor: 'pointer', padding: '10px' }}
                    onClick={() => this.openChunkPopup(index)}
                  >
                    <p>Chunk {index + 1}</p>
                    {isProcessing ? (
                      <span>⏳</span>
                    ) : isSuccess ? (
                      <span>✔</span>
                    ) : isFailed ? (
                      <span>✘</span>
                    ) : (
                      <span>⬜</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Popup Modal */}
        {selectedChunkIndex !== null && (
          <div className="modal is-active">
            <div className="modal-background" onClick={this.closeChunkPopup}></div>
            <div className="modal-card">
              <header className="modal-card-head">
                <p className="modal-card-title">Chunk {selectedChunkIndex + 1} Details</p>
                <button className="delete" aria-label="close" onClick={this.closeChunkPopup}></button>
              </header>
              <section className="modal-card-body">
                <div className="tabs is-boxed">
                  <ul>
                    <li className={popupTab === 'text' ? 'is-active' : ''}>
                      <a onClick={() => this.handlePopupTabChange('text')}>Text</a>
                    </li>
                    <li className={popupTab === 'embedding' ? 'is-active' : ''}>
                      <a onClick={() => this.handlePopupTabChange('embedding')}>Embedding</a>
                    </li>
                  </ul>
                </div>
                {popupTab === 'text' ? (
                  <div>
                    <h3 className="subtitle">Chunk Text</h3>
                    <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' }}>
                      {chunks[selectedChunkIndex]}
                    </pre>
                  </div>
                ) : (
                  <div>
                    <h3 className="subtitle">Embedding</h3>
                    {chunkStatuses[selectedChunkIndex].embedding ? (
                      <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' }}>
                        {JSON.stringify(chunkStatuses[selectedChunkIndex].embedding, null, 2)}
                      </pre>
                    ) : (
                      <p>No embedding available. Please embed the chunk first.</p>
                    )}
                    {chunkStatuses[selectedChunkIndex].error && (
                      <div className="notification is-danger is-light">
                        Error: {chunkStatuses[selectedChunkIndex].error}
                      </div>
                    )}
                  </div>
                )}
              </section>
              <footer className="modal-card-foot">
                <button className="button" onClick={this.closeChunkPopup}>Close</button>
              </footer>
            </div>
          </div>
        )}
      </div>
    );
  };

  render() {
    const { id } = this.props.params;
    const { activeTab } = this.state;

    return (
      <section className="section">
        <div className="container">
          <h1 className="title">Project: {id} - Flamekeeper</h1>

          {/* Tabs */}
          <div className="tabs is-boxed">
            <ul>
              <li className={activeTab === 'upload' ? 'is-active' : ''}>
                <a onClick={() => this.handleTabChange('upload')}>Upload Files</a>
              </li>
              <li className={activeTab === 'view' ? 'is-active' : ''}>
                <a onClick={() => this.handleTabChange('view')}>View Text</a>
              </li>
              <li className={activeTab === 'embed' ? 'is-active' : ''}>
                <a onClick={() => this.handleTabChange('embed')}>Embed Chunks</a>
              </li>
            </ul>
          </div>

          {/* Tab Content */}
          {activeTab === 'upload' && (
            <div>
              <h2 className="subtitle">Upload Word Documents for Project {id}</h2>
              <DropzoneWrapper onDrop={this.onDrop} />
              <h3 className="subtitle">Selected Files:</h3>
              {this.renderFileList()}
            </div>
          )}

          {activeTab === 'view' && (
            <div>
              {this.renderExtractedText()}
            </div>
          )}

          {activeTab === 'embed' && (
            <div>
              {this.renderEmbeddingResults()}
            </div>
          )}
        </div>
      </section>
    );
  }
}

export default withRouter(Project);