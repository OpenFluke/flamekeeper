import React, { Component } from "react";
import { withRouter } from "./withRouter";

class TestPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      project: null,
      query: "",
      result: "",
      modelAnswer: "",
      contextBlock: "",
      prompt: "", // <- NEW
      audioUrl: null,
      isPlaying: false,
    };
  }

  componentDidMount() {
    const { id } = this.props.params;
    fetch(`http://localhost:4000/test/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          this.setState({ project: data.project });
        }
      })
      .catch(console.error);
  }

  callAPI = async (endpoint) => {
    const { id } = this.props.params;
    const { query } = this.state;

    try {
      const res = await fetch(`http://localhost:4000/test/${id}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: endpoint === "query" ? JSON.stringify({ query }) : null,
      });

      const data = await res.json();
      this.setState({
        result: JSON.stringify(data, null, 2),
        modelAnswer: data.answer || "",
        contextBlock: data.context || "",
        prompt: data.prompt || "", // <- NEW
      });
    } catch (err) {
      this.setState({
        result: `Error: ${err.message}`,
        modelAnswer: "",
        contextBlock: "",
        prompt: "",
      });
    }
  };

  handleInputChange = (e) => {
    this.setState({ query: e.target.value });
  };

  stripThoughtTags = (response) => {
    const regex = /<think>[\s\S]*?<\/think>/gi;
    return response.replace(regex, "").trim();
  };

  sanitizeText = (text) => {
    return text.replace(/[^a-zA-Z0-9 .,!?'"()\[\]-]/g, "");
  };

  playAudioFromResponse = async () => {
    const { modelAnswer } = this.state;
    if (!modelAnswer) return;

    try {
      const cleaned = this.sanitizeText(this.stripThoughtTags(modelAnswer));
      const res = await fetch("http://localhost:5000/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleaned }),
      });

      if (!res.ok) throw new Error("TTS conversion failed");

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      this.setState({ audioUrl, isPlaying: true }, () => {
        const audio = new Audio(audioUrl);
        audio.play();
        audio.onended = () => this.setState({ isPlaying: false });
      });
    } catch (err) {
      console.error("TTS error:", err);
    }
  };

  render() {
    const {
      project,
      query,
      result,
      modelAnswer,
      contextBlock,
      prompt,
      isPlaying,
    } = this.state;

    return (
      <section className="section">
        <div className="container">
          <h1 className="title">Test RAG: {project?.name || "Loading..."}</h1>

          {project && (
            <div className="box">
              <p>
                <strong>Model:</strong> {project.model}
              </p>
              <p>
                <strong>Description:</strong> {project.description}
              </p>
              <p>
                <strong>Instructions:</strong> {project.instructions}
              </p>
            </div>
          )}

          <div className="box">
            <h2 className="subtitle">Test Connections</h2>
            <div className="buttons">
              <button
                className="button is-info"
                onClick={() => this.callAPI("ping")}
              >
                Test Model Ping
              </button>
              <button
                className="button is-warning"
                onClick={() => this.callAPI("rag")}
              >
                Test RAG Context
              </button>
              <button
                className="button is-dark"
                onClick={() => this.callAPI("query")}
              >
                Run Full Pipeline (No Input)
              </button>
            </div>
          </div>

          <div className="field mt-5">
            <label className="label">Ask Question via RAG + Model</label>
            <div className="control">
              <input
                className="input"
                value={query}
                onChange={this.handleInputChange}
                placeholder="e.g., What is Flamekeeper used for?"
              />
            </div>
            <div className="mt-2">
              <button
                className="button is-success"
                onClick={() => this.callAPI("query")}
                disabled={!query.trim()}
              >
                Ask with RAG Pipeline
              </button>
            </div>
          </div>

          {contextBlock && (
            <div className="box mt-4">
              <h2 className="subtitle">📚 RAG Context Sent to Model</h2>
              <pre style={{ whiteSpace: "pre-wrap" }}>{contextBlock}</pre>
            </div>
          )}

          {prompt && (
            <div className="box mt-4">
              <h2 className="subtitle">🧠 Final Prompt Sent to Model</h2>
              <pre style={{ whiteSpace: "pre-wrap" }}>{prompt}</pre>
            </div>
          )}

          <div className="box mt-4">
            <h2 className="subtitle">🧪 Raw Result (JSON)</h2>
            <pre>{result}</pre>
          </div>

          {modelAnswer && (
            <div className="box mt-3">
              <h2 className="subtitle">💬 Model Response</h2>
              <p style={{ whiteSpace: "pre-wrap" }}>{modelAnswer}</p>
              <button
                className="button is-primary mt-3"
                onClick={this.playAudioFromResponse}
                disabled={isPlaying}
              >
                🔊 Play as Audio
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }
}

export default withRouter(TestPage);
