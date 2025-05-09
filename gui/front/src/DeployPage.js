// DeployPage.js
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
    activeTab: "transcript",
    ragContext: "",
    promptSent: "",
    modelResponse: "",
    status: "Ready",
    isPlaying: false,
    audioUrl: null,
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
      this.setState({
        isRecording: true,
        audioChunks: [],
        status: "Recording...",
      });
    } catch (err) {
      console.error("❌ Failed to start recording:", err);
    }
  };

  stopRecording = () => {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
      this.setState({ isRecording: false, status: "Transcribing..." });
    }
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
          status: "Transcript received",
        }));
      } else {
        this.setState({ status: "No valid transcript." });
      }
    } catch (err) {
      console.error("❌ ASR error:", err);
      this.setState({ status: "ASR error" });
    }
  };

  sendPrompt = async () => {
    const { project } = this.state;
    const prompt = this.state.paragraphs.join("\n\n").trim();
    if (!prompt) return;

    this.setState({
      promptSent: prompt,
      modelResponse: "",
      status: "Sending prompt...",
      activeTab: "prompt",
    });

    try {
      const res = await fetch(
        this.props.serverBase + `:4000/test/${project.projectid}/query`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: prompt }),
        }
      );

      const data = await res.json();

      this.setState({
        ragContext: data.context || "",
        modelResponse: data.answer || "No response",
        paragraphs: [],
        lastTranscript: "",
        activeTab: "response",
        status: "Model response received ✅",
      });
    } catch (err) {
      console.error("❌ Error sending prompt:", err);
      this.setState({ status: "Error getting model response" });
    }
  };

  sanitizeText = (text) => text.replace(/[^a-zA-Z0-9 .,!?'"()\[\]-]/g, "");
  stripThoughtTags = (text) =>
    text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  playModelAudio = async () => {
    const { modelResponse } = this.state;
    if (!modelResponse) return;

    try {
      this.setState({ status: "🔈 Converting to speech...", isPlaying: true });
      const cleaned = this.sanitizeText(this.stripThoughtTags(modelResponse));
      const res = await fetch(this.props.serverBase + ":5000/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleaned }),
      });

      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);

      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () =>
        this.setState({ status: "Model response spoken ✅", isPlaying: false });
    } catch (err) {
      console.error("❌ TTS error:", err);
      this.setState({ status: "TTS error", isPlaying: false });
    }
  };

  toggleInfoModal = () => {
    this.setState((prev) => ({ showInfoModal: !prev.showInfoModal }));
  };

  switchTab = (tab) => {
    this.setState({ activeTab: tab });
  };

  render() {
    const {
      project,
      isRecording,
      lastTranscript,
      paragraphs,
      showInfoModal,
      activeTab,
      ragContext,
      promptSent,
      modelResponse,
      status,
      isPlaying,
    } = this.state;

    const renderTabContent = () => {
      switch (activeTab) {
        case "transcript":
          return (
            <div className="box has-background-dark has-text-white">
              {paragraphs.length
                ? paragraphs.map((p, i) => <p key={i}>{p}</p>)
                : "🧠 No transcript yet..."}
            </div>
          );
        case "context":
          return (
            <div className="box has-background-dark has-text-white">
              <pre>{ragContext || "📚 No context from RAG yet."}</pre>
            </div>
          );
        case "prompt":
          return (
            <div className="box has-background-dark has-text-white">
              <pre>{promptSent || "🧠 No prompt sent yet."}</pre>
            </div>
          );
        case "response":
          return (
            <div className="box has-background-dark has-text-white">
              <pre>{modelResponse || "💬 No model response yet."}</pre>
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <section
        className="section"
        style={{ position: "relative", minHeight: "100vh" }}
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

          {/* Status Indicator */}
          <div
            className="notification is-link is-light"
            style={{ marginBottom: "1rem" }}
          >
            <strong>Status:</strong> {status}
          </div>

          {/* Tab Bar */}
          <div className="tabs is-toggle is-fullwidth mt-4">
            <ul>
              {["transcript", "context", "prompt", "response"].map((tab) => (
                <li key={tab} className={activeTab === tab ? "is-active" : ""}>
                  <a onClick={() => this.switchTab(tab)}>
                    {tab === "transcript"
                      ? "Transcript"
                      : tab === "context"
                      ? "RAG Context"
                      : tab === "prompt"
                      ? "Prompt Sent"
                      : "Model Response"}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {renderTabContent()}

          {/* Controls */}
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
            <button
              className="button is-primary"
              onClick={this.playModelAudio}
              disabled={!modelResponse || isPlaying}
            >
              🔊 Play Audio
            </button>
          </div>

          {/* Last transcript */}
          {lastTranscript && (
            <div style={{ color: "#0ff", opacity: 0.8, marginTop: "1rem" }}>
              <strong>🎤 Last Transcript:</strong> {lastTranscript}
            </div>
          )}

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
