// src/DeployPage.js
import React, { Component } from "react";
import { useParams } from "react-router-dom";
import EffectBackground from "./EffectBackground";

class DeployPageInner extends Component {
  state = {
    project: null,
    loading: true,
    error: "",
    userInput: "",
    showInfoModal: false,
    aiMessages: ["AI activity will appear here..."],
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
    const { userInput, aiMessages } = this.state;
    if (!userInput.trim()) return;

    const newMessages = [
      ...aiMessages,
      `You: ${userInput}`,
      `AI: Thinking about "${userInput}"...`,
    ];

    this.setState({ aiMessages: newMessages, userInput: "" });
  };

  toggleInfoModal = () => {
    this.setState((prev) => ({ showInfoModal: !prev.showInfoModal }));
  };

  render() {
    const { project, loading, error, userInput, showInfoModal, aiMessages } =
      this.state;

    return (
      <section
        className="section"
        style={{
          position: "relative",
          minHeight: "100vh",
          overflow: "hidden",
          paddingBottom: "6rem",
        }}
      >
        {/* 🔥 Background 3D effect */}
        <EffectBackground effectId={1} />

        {/* 🧊 Content */}
        <div
          className="container"
          style={{
            position: "relative",
            zIndex: 1,
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          {/* Controls */}
          <div className="buttons">
            <button className="button is-info" onClick={this.toggleInfoModal}>
              Show Project Info
            </button>
          </div>

          {/* Title */}
          <h1 className="title has-text-white">
            Deploy: {project?.name || "Loading..."}
          </h1>

          {/* Scrollable AI message area */}
          <div
            style={{
              flexGrow: 1,
              minHeight: "40vh",
              maxHeight: "60vh",
              overflowY: "auto",
              paddingRight: "0.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {aiMessages.map((msg, idx) => {
              const isAI = msg.startsWith("AI:");
              return (
                <div
                  key={idx}
                  style={{
                    alignSelf: isAI ? "flex-start" : "flex-end",
                    maxWidth: "75%",
                    padding: "0.75rem 1rem",
                    borderRadius: "12px",
                    backgroundColor: "rgba(0,0,0,0.5)",
                    backdropFilter: "blur(6px)",
                    color: "#fff",
                    fontWeight: 500,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg}
                </div>
              );
            })}
          </div>

          {/* Input */}
          <div className="field is-grouped">
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

          {/* Modal */}
          {showInfoModal && project && (
            <div className="modal is-active">
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
