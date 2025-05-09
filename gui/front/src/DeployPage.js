import React, { Component } from "react";
import { useParams } from "react-router-dom";
import EffectBackground from "./EffectBackground";

class DeployPageInner extends Component {
  state = {
    project: null,
    loading: true,
    error: "",
    isRecording: false,
    audioChunks: [],
    lastTranscript: "",
    paragraphs: [],
    showInfoModal: false,
  };

  mediaRecorder = null;
  stream = null;

  componentDidMount() {
    const { projectid } = this.props;

    fetch(this.props.serverBase + `:4000/api/deploy/${projectid}`)
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

  componentWillUnmount() {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }
  }

  startRecording = async () => {
    if (this.state.isRecording) return;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: "audio/webm",
      });

      const chunks = [];
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        this.setState({ audioChunks: chunks }, this.sendAudioToASR);
      };

      this.mediaRecorder.start();
      this.setState({ isRecording: true, audioChunks: [] });
    } catch (err) {
      console.error("❌ Failed to start recording:", err);
    }
  };

  stopRecording = () => {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
    this.setState({ isRecording: false });
  };

  sendAudioToASR = async () => {
    const { audioChunks } = this.state;
    if (!audioChunks.length) return;

    const blob = new Blob(audioChunks, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("file", blob, "input.ogg");

    try {
      const res = await fetch(this.props.serverBase + ":8020/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      const transcript = data.transcriptions?.[0];

      if (transcript && transcript.length > 1) {
        this.setState((prev) => ({
          paragraphs: [...prev.paragraphs, transcript.trim()],
          lastTranscript: transcript,
          audioChunks: [],
        }));
      }
    } catch (err) {
      console.error("❌ ASR error:", err);
    }
  };

  sendPrompt = () => {
    const fullPrompt = this.state.paragraphs.join("\n\n").trim();
    if (fullPrompt.length === 0) return;

    console.log("🧠 Full Prompt Sent:\n", fullPrompt);

    this.setState((prev) => ({
      paragraphs: [],
      lastTranscript: "",
    }));
  };

  toggleInfoModal = () => {
    this.setState((prev) => ({ showInfoModal: !prev.showInfoModal }));
  };

  render() {
    const {
      project,
      loading,
      error,
      isRecording,
      lastTranscript,
      paragraphs,
      showInfoModal,
    } = this.state;

    return (
      <section
        className="section"
        style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}
      >
        <EffectBackground effectId={1} />

        <div
          className="container"
          style={{ position: "relative", zIndex: 1, color: "#fff" }}
        >
          <div className="buttons">
            <button className="button is-info" onClick={this.toggleInfoModal}>
              Show Project Info
            </button>
          </div>

          <h1 className="title has-text-white">
            Deploy: {project?.name || "Loading..."}
          </h1>

          {/* Display transcript paragraphs */}
          <div
            className="box has-background-dark has-text-white"
            style={{ minHeight: "40vh", whiteSpace: "pre-wrap" }}
          >
            {paragraphs.length > 0
              ? paragraphs.map((p, i) => <p key={i}>{p}</p>)
              : "🧠 No transcript yet..."}
          </div>

          <div className="buttons mt-4">
            <button
              className={`button ${isRecording ? "is-warning" : "is-primary"}`}
              onClick={isRecording ? this.stopRecording : this.startRecording}
            >
              {isRecording ? "Stop Recording" : "Start Recording"}
            </button>
            <button className="button is-success" onClick={this.sendPrompt}>
              Send Prompt
            </button>
          </div>

          {/* Optional display of last chunk */}
          {lastTranscript && (
            <div style={{ color: "#0ff", opacity: 0.8, marginTop: "1rem" }}>
              <strong>🎤 Last Transcript:</strong> {lastTranscript}
            </div>
          )}

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

export default function DeployPageWrapper(props) {
  const { projectid } = useParams();
  return (
    <DeployPageInner projectid={projectid} serverBase={props.serverBase} />
  );
}
