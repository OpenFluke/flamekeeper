import React, { Component } from 'react';

class EmbedChunks extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chunkStatuses: [], // Store status of each chunk: { status: 'pending' | 'success' | 'failed', error: string, embedding: array }
      isEmbedding: false, // Track if embedding process is running
      selectedChunkIndex: null, // Track the chunk selected for the popup
      popupTab: 'text', // 'text' or 'embedding' for the popup
    };
  }

  // Update chunk statuses when chunks change
  componentDidUpdate(prevProps) {
    if (prevProps.chunks !== this.props.chunks) {
      const chunkStatuses = this.props.chunks.map(() => ({ status: 'pending', error: '', embedding: null }));
      this.setState({ chunkStatuses, selectedChunkIndex: null });
    }
  }

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
    const { chunks } = this.props;
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

  render() {
    const { chunks } = this.props;
    const { chunkStatuses, isEmbedding, selectedChunkIndex, popupTab } = this.state;
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
              const status = chunkStatuses[index] || { status: 'pending', error: '', embedding: null };
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
                    {chunkStatuses[selectedChunkIndex] && chunkStatuses[selectedChunkIndex].embedding ? (
                      <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' }}>
                        {JSON.stringify(chunkStatuses[selectedChunkIndex].embedding, null, 2)}
                      </pre>
                    ) : (
                      <p>No embedding available. Please embed the chunk first.</p>
                    )}
                    {chunkStatuses[selectedChunkIndex] && chunkStatuses[selectedChunkIndex].error && (
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
  }
}

export default EmbedChunks;