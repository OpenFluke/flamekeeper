import React, { Component } from "react";

class EmbedChunks extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chunkStatuses: [],
      isEmbedding: false,
      selectedChunkIndex: null,
      popupTab: "text",
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.chunks !== this.props.chunks) {
      const chunkStatuses = this.props.chunks.map(() => ({
        status: "pending",
        error: "",
        embedding: null,
      }));
      this.setState({ chunkStatuses, selectedChunkIndex: null });
    }
  }

  embedSingleChunk = async (chunk, index) => {
    try {
      const response = await fetch("http://localhost:8000/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chunk }),
      });

      const data = await response.json();
      const updatedStatus = data.error
        ? {
            status: "failed",
            error: data.error,
            embedding: null,
          }
        : {
            status: "success",
            error: "",
            embedding: data.embedding,
          };

      this.setState((prevState) => {
        const newStatuses = [...prevState.chunkStatuses];
        newStatuses[index] = updatedStatus;
        return { chunkStatuses: newStatuses };
      });
    } catch (error) {
      this.setState((prevState) => {
        const newStatuses = [...prevState.chunkStatuses];
        newStatuses[index] = {
          status: "failed",
          error: error.message,
          embedding: null,
        };
        return { chunkStatuses: newStatuses };
      });
    }
  };

  embedChunks = async () => {
    const { chunks } = this.props;
    if (chunks.length === 0) {
      alert("No chunks to embed. Please upload documents first.");
      return;
    }

    this.setState({ isEmbedding: true }, async () => {
      for (let i = 0; i < chunks.length; i++) {
        const { isEmbedding } = this.state;
        if (!isEmbedding) break;
        await this.embedSingleChunk(chunks[i], i);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      this.setState({ isEmbedding: false });
    });
  };

  stopEmbedding = () => {
    this.setState({ isEmbedding: false });
  };

  openChunkPopup = (index) => {
    this.setState({ selectedChunkIndex: index, popupTab: "text" });
  };

  closeChunkPopup = () => {
    this.setState({ selectedChunkIndex: null, popupTab: "text" });
  };

  handlePopupTabChange = (tab) => {
    this.setState({ popupTab: tab });
  };

  pushToCache = async () => {
    const { chunkStatuses } = this.state;
    const { chunks, projectId } = this.props;

    const successful = chunkStatuses
      .map((status, index) => ({ status, index }))
      .filter(({ status }) => status.status === "success");

    if (successful.length === 0) {
      alert("No successful embeddings to push.");
      return;
    }

    let errors = 0;

    for (let i = 0; i < successful.length; i++) {
      const { index } = successful[i];

      // Mark as pushing
      this.setState((prevState) => {
        const updated = [...prevState.chunkStatuses];
        updated[index] = { ...updated[index], status: "pushing" };
        return { chunkStatuses: updated };
      });

      const payload = {
        id: `chunk-${index + 1}`,
        text: chunks[index],
        embedding: chunkStatuses[index].embedding,
      };

      try {
        const res = await fetch(
          `http://localhost:4000/api/gpt/${projectId}/embed`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const result = await res.json();

        this.setState((prevState) => {
          const updated = [...prevState.chunkStatuses];
          updated[index].status = result.success ? "pushed" : "failed";
          return { chunkStatuses: updated };
        });

        if (!result.success) errors++;
      } catch (err) {
        console.error(`Network error for chunk-${index + 1}:`, err.message);
        errors++;
        this.setState((prevState) => {
          const updated = [...prevState.chunkStatuses];
          updated[index].status = "failed";
          return { chunkStatuses: updated };
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    alert(
      errors === 0
        ? "All chunks pushed to cache!"
        : `${successful.length - errors} pushed, ${errors} failed.`
    );
  };

  embedChunksThenPush = async () => {
    await this.embedChunks();
    this.pushToCache();
  };

  render() {
    const { chunks, projectId } = this.props;
    const { chunkStatuses, isEmbedding, selectedChunkIndex, popupTab } =
      this.state;

    return (
      <div>
        <h2 className="subtitle">Embed Chunks</h2>
        <div className="mb-4 buttons">
          <button
            className="button is-primary"
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

          <button
            className="button is-link"
            onClick={this.pushToCache}
            disabled={
              chunkStatuses.filter((cs) => cs.status === "success").length === 0
            }
          >
            Push Embedded Chunks to Cache
          </button>
        </div>

        {chunks.length === 0 ? (
          <p>No chunks to embed. Please create chunks in the View Text tab.</p>
        ) : (
          <div className="columns is-multiline">
            {chunks.map((chunk, index) => {
              const status = chunkStatuses[index] || {
                status: "pending",
                error: "",
                embedding: null,
              };

              const icon =
                {
                  pending: "⬜",
                  success: "✔",
                  pushing: "📤",
                  pushed: "✅",
                  failed: "✘",
                }[status.status] || "⬜";

              return (
                <div key={index} className="column is-2">
                  <div
                    className={`box has-text-centered ${
                      status.status === "success"
                        ? "has-background-success-light"
                        : ""
                    } ${
                      status.status === "failed"
                        ? "has-background-danger-light"
                        : ""
                    }`}
                    style={{ cursor: "pointer", padding: "10px" }}
                    onClick={() => this.openChunkPopup(index)}
                  >
                    <p>Chunk {index + 1}</p>
                    <span>{icon}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Popup Modal */}
        {selectedChunkIndex !== null && (
          <div className="modal is-active">
            <div
              className="modal-background"
              onClick={this.closeChunkPopup}
            ></div>
            <div className="modal-card">
              <header className="modal-card-head">
                <p className="modal-card-title">
                  Chunk {selectedChunkIndex + 1} Details
                </p>
                <button
                  className="delete"
                  aria-label="close"
                  onClick={this.closeChunkPopup}
                ></button>
              </header>
              <section className="modal-card-body">
                <div className="tabs is-boxed">
                  <ul>
                    <li className={popupTab === "text" ? "is-active" : ""}>
                      <a onClick={() => this.handlePopupTabChange("text")}>
                        Text
                      </a>
                    </li>
                    <li className={popupTab === "embedding" ? "is-active" : ""}>
                      <a onClick={() => this.handlePopupTabChange("embedding")}>
                        Embedding
                      </a>
                    </li>
                  </ul>
                </div>
                {popupTab === "text" ? (
                  <div>
                    <h3 className="subtitle">Chunk Text</h3>
                    <pre
                      style={{
                        whiteSpace: "pre-wrap",
                        maxHeight: "300px",
                        overflowY: "auto",
                      }}
                    >
                      {chunks[selectedChunkIndex]}
                    </pre>
                  </div>
                ) : (
                  <div>
                    <h3 className="subtitle">Embedding</h3>
                    {chunkStatuses[selectedChunkIndex] &&
                    chunkStatuses[selectedChunkIndex].embedding ? (
                      <pre
                        style={{
                          whiteSpace: "pre-wrap",
                          maxHeight: "300px",
                          overflowY: "auto",
                        }}
                      >
                        {JSON.stringify(
                          chunkStatuses[selectedChunkIndex].embedding,
                          null,
                          2
                        )}
                      </pre>
                    ) : (
                      <p>
                        No embedding available. Please embed the chunk first.
                      </p>
                    )}
                    {chunkStatuses[selectedChunkIndex] &&
                      chunkStatuses[selectedChunkIndex].error && (
                        <div className="notification is-danger is-light">
                          Error: {chunkStatuses[selectedChunkIndex].error}
                        </div>
                      )}
                  </div>
                )}
              </section>
              <footer className="modal-card-foot">
                <button className="button" onClick={this.closeChunkPopup}>
                  Close
                </button>
              </footer>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default EmbedChunks;
