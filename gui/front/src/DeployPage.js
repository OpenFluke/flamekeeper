// src/DeployPage.js
import React, { Component } from "react";
import { useParams } from "react-router-dom";

class DeployPageInner extends Component {
  state = {
    project: null,
    loading: true,
    error: "",
    userInput: "",
    showInfoModal: false,
  };

  componentDidMount() {
    const { projectid } = this.props;
    fetch(`http://localhost:4000/api/deploy/${projectid}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          this.setState({ project: data.project, loading: false });
        } else {
          this.setState({ error: data.message, loading: false });
        }
      })
      .catch((err) => this.setState({ error: err.message, loading: false }));
  }

  handleInputChange = (e) => {
    this.setState({ userInput: e.target.value });
  };

  handleManualSend = () => {
    alert(`Sending to AI: ${this.state.userInput}`);
  };

  toggleInfoModal = () => {
    this.setState((prev) => ({ showInfoModal: !prev.showInfoModal }));
  };

  render() {
    const { project, loading, error, userInput, showInfoModal } = this.state;

    return (
      <section className="section">
        <div className="container">
          {/* Top Buttons */}
          <div className="buttons">
            <button className="button is-info" onClick={this.toggleInfoModal}>
              Show Project Info
            </button>
          </div>

          {/* Title */}
          <h1 className="title has-text-white">
            Deploy: {project?.name || "Loading..."}
          </h1>

          {/* Loading / Error */}
          {loading && <p className="has-text-grey-light">Loading project...</p>}
          {error && <p className="notification is-danger">{error}</p>}

          {/* Foreground Panel */}
          <div
            className="box has-background-dark has-text-white"
            style={{ height: "60vh", overflowY: "auto" }}
          >
            <p className="is-size-5 has-text-info">
              AI activity will appear here...
            </p>
          </div>

          {/* Manual Send Input Below */}
          <div className="field is-grouped mt-4">
            <div className="control is-expanded">
              <input
                className="input"
                type="text"
                placeholder="Type command..."
                value={userInput}
                onChange={this.handleInputChange}
              />
            </div>
            <div className="control">
              <button
                className="button is-primary"
                onClick={this.handleManualSend}
              >
                Send
              </button>
            </div>
          </div>

          {/* Modal for Project Info */}
          {showInfoModal && project && (
            <div className={`modal ${showInfoModal ? "is-active" : ""}`}>
              <div
                className="modal-background"
                onClick={this.toggleInfoModal}
              ></div>
              <div className="modal-card">
                <header className="modal-card-head">
                  <p className="modal-card-title">Project Info</p>
                  <button
                    className="delete"
                    aria-label="close"
                    onClick={this.toggleInfoModal}
                  ></button>
                </header>
                <section className="modal-card-body">
                  <p>
                    <strong>Description:</strong> {project.description}
                  </p>
                  <p>
                    <strong>Model:</strong> {project.model}
                  </p>
                  <p>
                    <strong>Instructions:</strong> {project.instructions}
                  </p>
                  <p>
                    <strong>Trigger Words:</strong>{" "}
                    {project.triggerwords || "None"}
                  </p>
                  <p>
                    <strong>Timeout:</strong>{" "}
                    {project.timeoutSeconds ?? "Not set"} sec
                  </p>
                </section>
                <footer className="modal-card-foot">
                  <button
                    className="button is-danger"
                    onClick={this.toggleInfoModal}
                  >
                    Close
                  </button>
                </footer>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }
}

export default function DeployPageWrapper() {
  const { projectid } = useParams();
  return <DeployPageInner projectid={projectid} />;
}
