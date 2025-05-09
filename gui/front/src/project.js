import React, { Component } from "react";
import { withRouter } from "./withRouter";
import { Link } from "react-router-dom";
import UploadFiles from "./UploadFiles";
import ViewText from "./ViewText";
import EmbedChunks from "./EmbedChunks";

class Project extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: "upload",
      files: [],
      extractedText: "",
      chunks: [],
      project: null,
      isEditModalOpen: false,
      editDescription: "",
      editModel: "cogito:3b",
      editInstructions: "",
      triggerWords: "", // NEW
      errorMessage: "",
      projectNotFound: false,
      timeoutSeconds: 3,
    };
  }

  componentDidMount() {
    this.fetchProject();
  }

  fetchProject = async () => {
    const { id } = this.props.params;
    try {
      const response = await fetch(
        this.props.serverBase + ":4000/api/projects"
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch projects: ${response.status} ${response.statusText}`
        );
      }
      const data = await response.json();
      if (data.success) {
        const project = data.projects.find((proj) => proj.projectid === id);
        if (project) {
          this.setState({
            project,
            editDescription: project.description,
            editModel: project.model || "cogito:3b",
            editInstructions: project.instructions || "",
            triggerWords: project.triggerwords || "", // NEW
            timeoutSeconds: project.timeoutSeconds ?? 3,
            projectNotFound: false,
          });
        } else {
          this.setState({
            projectNotFound: true,
            errorMessage: "Project not found",
          });
        }
      } else {
        this.setState({
          errorMessage: data.message || "Failed to fetch project",
          projectNotFound: true,
        });
      }
    } catch (error) {
      this.setState({ errorMessage: error.message, projectNotFound: true });
    }
  };

  // In handleEditInputChange
  handleEditInputChange = (e) => {
    const { name, value } = e.target;
    this.setState({
      [name]: name === "timeoutSeconds" ? parseInt(value, 10) : value,
    }); // ⬅️ Type check for number
  };

  handleTabChange = (tab) => {
    this.setState({ activeTab: tab });
  };

  handleFilesChange = (files) => {
    this.setState({ files });
  };

  handleExtractedTextChange = (extractedText) => {
    this.setState({ extractedText, chunks: [] });
  };

  handleChunksChange = (chunks) => {
    this.setState({ chunks });
  };

  openEditModal = () => {
    this.setState({ isEditModalOpen: true });
  };

  closeEditModal = () => {
    this.setState({ isEditModalOpen: false, errorMessage: "" });
  };

  handleEditInputChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };

  updateProject = async () => {
    const { id } = this.props.params;
    const {
      editDescription,
      editModel,
      editInstructions,
      triggerWords,
      timeoutSeconds,
    } = this.state;

    try {
      const response = await fetch(
        this.props.serverBase + `:4000/api/gpt/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: editDescription,
            model: editModel,
            instructions: editInstructions,
            triggerwords: triggerWords, // NEW
            timeoutSeconds,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        this.setState({
          project: {
            ...this.state.project,
            description: editDescription,
            model: editModel,
            instructions: editInstructions,
            triggerwords: triggerWords, // NEW
            timeoutSeconds,
          },
          isEditModalOpen: false,
          errorMessage: "",
        });
      } else {
        this.setState({
          errorMessage: data.message || "Failed to update project",
        });
      }
    } catch (error) {
      this.setState({ errorMessage: error.message });
    }
  };

  deleteProject = async () => {
    const { id } = this.props.params;
    if (!window.confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      const response = await fetch(
        this.props.serverBase + `:4000/api/gpt/${id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();
      if (data.success) {
        this.props.navigate("/projects");
      } else {
        this.setState({
          errorMessage: data.message || "Failed to delete project",
        });
      }
    } catch (error) {
      this.setState({ errorMessage: error.message });
    }
  };

  clearDocumentCache = async () => {
    const { id } = this.props.params;
    const { project } = this.state;
    if (
      !window.confirm(
        "Are you sure you want to delete all document embeddings for this project?"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        this.props.serverBase + `:4000/api/gpt/${project.projectid}/embed`,
        {
          method: "DELETE",
        }
      );
      const data = await response.json();
      if (data.success) {
        alert("Document cache cleared successfully.");
      } else {
        alert("Failed to clear cache: " + data.message);
      }
    } catch (error) {
      alert("Error clearing cache: " + error.message);
    }
  };

  render() {
    const { id } = this.props.params;
    const {
      activeTab,
      files,
      extractedText,
      chunks,
      project,
      isEditModalOpen,
      editDescription,
      editModel,
      editInstructions,
      triggerWords,
      errorMessage,
      projectNotFound,
      timeoutSeconds,
    } = this.state;

    if (projectNotFound) {
      return (
        <section className="section">
          <div className="container">
            <h1 className="title">Project: {id} - Flamekeeper</h1>
            <div className="notification is-danger">{errorMessage}</div>
            <Link to="/projects" className="button is-primary">
              Back to Projects
            </Link>
          </div>
        </section>
      );
    }

    return (
      <section className="section">
        <div className="container">
          <h1 className="title">Project: {id} - Flamekeeper</h1>
          <div className="buttons is-justify-content-space-between is-flex-wrap-wrap">
            <div className="is-flex is-flex-grow-1">
              <Link to="/projects" className="button is-primary mr-2">
                Back to Projects
              </Link>
              <button
                className="button is-info mr-2"
                onClick={this.openEditModal}
              >
                Edit Project
              </button>
              <button className="button is-danger" onClick={this.deleteProject}>
                Delete Project
              </button>
            </div>
            <div>
              <Link
                to={`/test/${this.state.project?.projectid}`}
                className="button is-warning"
              >
                Go to Test Page
              </Link>
            </div>
          </div>

          {errorMessage && (
            <div className="notification is-danger">{errorMessage}</div>
          )}

          {project && (
            <div className="box">
              <h2 className="subtitle">Project Details</h2>
              <p>
                <strong>Description:</strong> {project.description}
              </p>
              <p>
                <strong>Model:</strong> {project.model || "Not set"}
              </p>
              <p>
                <strong>Instructions:</strong>{" "}
                {project.instructions || "Not set"}
              </p>
              <p>
                <strong>Trigger Words:</strong> {project.triggerwords || "None"}
              </p>
            </div>
          )}

          <div className="tabs is-boxed">
            <ul>
              <li className={activeTab === "upload" ? "is-active" : ""}>
                <a onClick={() => this.handleTabChange("upload")}>
                  Upload Files
                </a>
              </li>
              <li className={activeTab === "view" ? "is-active" : ""}>
                <a onClick={() => this.handleTabChange("view")}>View Text</a>
              </li>
              <li className={activeTab === "embed" ? "is-active" : ""}>
                <a onClick={() => this.handleTabChange("embed")}>
                  Embed Chunks
                </a>
              </li>
            </ul>
          </div>

          {activeTab === "upload" && (
            <UploadFiles
              projectId={id}
              onFilesChange={this.handleFilesChange}
              onExtractedTextChange={this.handleExtractedTextChange}
            />
          )}
          {activeTab === "view" && (
            <ViewText
              files={files}
              extractedText={extractedText}
              onChunksChange={this.handleChunksChange}
            />
          )}
          {activeTab === "embed" && (
            <EmbedChunks
              chunks={chunks}
              projectId={this.state.project?.projectid}
            />
          )}

          {/* Edit Project Modal */}
          {isEditModalOpen && (
            <div className="modal is-active">
              <div
                className="modal-background"
                onClick={this.closeEditModal}
              ></div>
              <div className="modal-card">
                <header className="modal-card-head">
                  <p className="modal-card-title">Edit Project</p>
                  <button
                    className="delete"
                    aria-label="close"
                    onClick={this.closeEditModal}
                  ></button>
                </header>
                <section className="modal-card-body">
                  {errorMessage && (
                    <div className="notification is-danger">{errorMessage}</div>
                  )}
                  <div className="field">
                    <label className="label">Description</label>
                    <div className="control">
                      <textarea
                        className="textarea"
                        name="editDescription"
                        value={editDescription}
                        onChange={this.handleEditInputChange}
                        placeholder="Enter project description"
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">Ollama Model</label>
                    <div className="control">
                      <input
                        className="input"
                        type="text"
                        name="editModel"
                        value={editModel}
                        onChange={this.handleEditInputChange}
                        placeholder="e.g., cogito:3b"
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">Instructions</label>
                    <div className="control">
                      <textarea
                        className="textarea"
                        name="editInstructions"
                        value={editInstructions}
                        onChange={this.handleEditInputChange}
                        placeholder="Enter project instructions"
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label className="label">
                      Trigger Words (comma-separated)
                    </label>
                    <div className="control">
                      <input
                        className="input"
                        type="text"
                        name="triggerWords"
                        value={triggerWords}
                        onChange={this.handleEditInputChange}
                        placeholder="e.g., bob,dog,launch"
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Silence Timeout (seconds)</label>
                    <div className="control">
                      <input
                        className="input"
                        type="number"
                        name="timeoutSeconds"
                        value={timeoutSeconds}
                        onChange={this.handleEditInputChange}
                        placeholder="e.g., 3"
                        min="1"
                      />
                    </div>
                  </div>
                </section>
                <footer
                  className="modal-card-foot"
                  style={{ justifyContent: "space-between" }}
                >
                  <div>
                    <button
                      className="button is-warning"
                      onClick={this.clearDocumentCache}
                    >
                      Clear Document Cache
                    </button>
                  </div>
                  <div>
                    <button
                      className="button is-success"
                      onClick={this.updateProject}
                    >
                      Save Changes
                    </button>
                    <button className="button" onClick={this.closeEditModal}>
                      Cancel
                    </button>
                  </div>
                </footer>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }
}

export default withRouter(Project);
