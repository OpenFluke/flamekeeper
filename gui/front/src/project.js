import React, { Component } from 'react';
import { withRouter } from './withRouter';
import { Link } from 'react-router-dom';
import UploadFiles from './UploadFiles';
import ViewText from './ViewText';
import EmbedChunks from './EmbedChunks';

class Project extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: 'upload', // 'upload', 'view', or 'embed'
      files: [], // Store uploaded files for this project
      extractedText: '', // Store the extracted text
      chunks: [], // Store text chunks for embedding
      project: null, // Store project details (description, model, instructions)
      isEditModalOpen: false, // Track if the edit modal is open
      editDescription: '',
      editModel: 'cogito:3b', // Default model
      editInstructions: '',
      errorMessage: '',
      projectNotFound: false, // Track if the project was not found
    };
  }

  // Fetch project details when the component mounts
  componentDidMount() {
    this.fetchProject();
  }

  // Fetch project by ID
  fetchProject = async () => {
    const { id } = this.props.params;
    try {
      const response = await fetch('http://localhost:4000/api/projects');
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success) {
        const project = data.projects.find(proj => proj.projectid === id);
        if (project) {
          this.setState({
            project,
            editDescription: project.description,
            editModel: project.model || 'cogito:3b',
            editInstructions: project.instructions || '',
            projectNotFound: false,
          });
        } else {
          this.setState({ projectNotFound: true, errorMessage: 'Project not found' });
        }
      } else {
        this.setState({ errorMessage: data.message || 'Failed to fetch project', projectNotFound: true });
      }
    } catch (error) {
      this.setState({ errorMessage: error.message, projectNotFound: true });
    }
  };

  // Handle tab switching
  handleTabChange = (tab) => {
    this.setState({ activeTab: tab });
  };

  // Handle files change from UploadFiles
  handleFilesChange = (files) => {
    this.setState({ files });
  };

  // Handle extracted text change from UploadFiles
  handleExtractedTextChange = (extractedText) => {
    this.setState({ extractedText, chunks: [] }); // Reset chunks when text changes
  };

  // Handle chunks change from ViewText
  handleChunksChange = (chunks) => {
    this.setState({ chunks });
  };

  // Open the edit modal
  openEditModal = () => {
    this.setState({ isEditModalOpen: true });
  };

  // Close the edit modal
  closeEditModal = () => {
    this.setState({ isEditModalOpen: false, errorMessage: '' });
  };

  // Handle input changes in the edit modal
  handleEditInputChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };

  // Update the project
  updateProject = async () => {
    const { id } = this.props.params;
    const { editDescription, editModel, editInstructions } = this.state;

    try {
      const response = await fetch(`http://localhost:4000/api/gpt/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editDescription,
          model: editModel,
          instructions: editInstructions,
        }),
      });

      const data = await response.json();
      if (data.success) {
        this.setState({
          project: { ...this.state.project, description: editDescription, model: editModel, instructions: editInstructions },
          isEditModalOpen: false,
          errorMessage: '',
        });
      } else {
        this.setState({ errorMessage: data.message || 'Failed to update project' });
      }
    } catch (error) {
      this.setState({ errorMessage: error.message });
    }
  };

  // Delete the project
  deleteProject = async () => {
    const { id } = this.props.params;
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/api/gpt/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      if (data.success) {
        this.props.navigate('/projects'); // Redirect to /projects after deletion
      } else {
        this.setState({ errorMessage: data.message || 'Failed to delete project' });
      }
    } catch (error) {
      this.setState({ errorMessage: error.message });
    }
  };

  render() {
    const { id } = this.props.params;
    const { activeTab, files, extractedText, chunks, project, isEditModalOpen, editDescription, editModel, editInstructions, errorMessage, projectNotFound } = this.state;

    // If the project was not found, display an error message
    if (projectNotFound) {
      return (
        <section className="section">
          <div className="container">
            <h1 className="title">Project: {id} - Flamekeeper</h1>
            <div className="notification is-danger">
              {errorMessage}
            </div>
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
          <div className="buttons">
            <Link to="/projects" className="button is-primary">
              Back to Projects
            </Link>
            <button className="button is-info" onClick={this.openEditModal}>
              Edit Project
            </button>
            <button className="button is-danger" onClick={this.deleteProject}>
              Delete Project
            </button>
          </div>

          {errorMessage && (
            <div className="notification is-danger">
              {errorMessage}
            </div>
          )}

          {project && (
            <div className="box">
              <h2 className="subtitle">Project Details</h2>
              <p><strong>Description:</strong> {project.description}</p>
              <p><strong>Model:</strong> {project.model || 'Not set'}</p>
              <p><strong>Instructions:</strong> {project.instructions || 'Not set'}</p>
            </div>
          )}

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
            <UploadFiles
              projectId={id}
              onFilesChange={this.handleFilesChange}
              onExtractedTextChange={this.handleExtractedTextChange}
            />
          )}

          {activeTab === 'view' && (
            <ViewText
              files={files}
              extractedText={extractedText}
              onChunksChange={this.handleChunksChange}
            />
          )}

          {activeTab === 'embed' && (
            <EmbedChunks chunks={chunks} />
          )}

          {/* Edit Project Modal */}
          {isEditModalOpen && (
            <div className="modal is-active">
              <div className="modal-background" onClick={this.closeEditModal}></div>
              <div className="modal-card">
                <header className="modal-card-head">
                  <p className="modal-card-title">Edit Project</p>
                  <button className="delete" aria-label="close" onClick={this.closeEditModal}></button>
                </header>
                <section className="modal-card-body">
                  {errorMessage && (
                    <div className="notification is-danger">
                      {errorMessage}
                    </div>
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
                </section>
                <footer className="modal-card-foot">
                  <button className="button is-success" onClick={this.updateProject}>Save Changes</button>
                  <button className="button" onClick={this.closeEditModal}>Cancel</button>
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