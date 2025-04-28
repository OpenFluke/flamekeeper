import React, { Component } from 'react';
import { withRouter } from './withRouter'; // Import withRouter from './withRouter'
import { Link } from 'react-router-dom'; // Import Link from 'react-router-dom'
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
    };
  }

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

  render() {
    const { id } = this.props.params;
    const { activeTab, files, extractedText, chunks } = this.state;

    return (
      <section className="section">
        <div className="container">
          <h1 className="title">Project: {id} - Flamekeeper</h1>
          <Link to="/projects" className="button is-primary mb-4">
            Back to Projects
          </Link>

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
        </div>
      </section>
    );
  }
}

export default withRouter(Project);