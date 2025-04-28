import React, { Component } from 'react';
import mammoth from 'mammoth';
import { useDropzone } from 'react-dropzone';

// Functional component to use the useDropzone hook
const DropzoneWrapper = ({ onDrop }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
  });

  return (
    <div {...getRootProps()} className={`box ${isDragActive ? 'has-background-light' : ''}`}>
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the files here...</p>
      ) : (
        <p>Drag and drop .docx files here, or click to select files</p>
      )}
    </div>
  );
};

class Documents extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: 'upload', // 'upload' or 'view'
      files: [], // Store uploaded files
      extractedText: '', // Store combined extracted text from all files
      chunks: [], // Store text chunks for embedding
    };
  }

  // Handle tab switching
  handleTabChange = (tab) => {
    this.setState({ activeTab: tab });
  };

  // Handle file selection (both drag-and-drop and button click)
  onDrop = (acceptedFiles) => {
    const newFiles = [...this.state.files, ...acceptedFiles];
    this.setState({ files: newFiles }, () => {
      this.extractTextFromFiles(newFiles);
    });
  };

  // Extract text from Word documents
  extractTextFromFiles = async (files) => {
    let combinedText = '';
    for (const file of files) {
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        combinedText += result.value + '\n\n';
      }
    }

    // Chunk the text for nomic-ai/nomic-embed-text-v1
    const chunks = this.chunkText(combinedText);

    this.setState({
      extractedText: combinedText,
      chunks: chunks,
    });
  };

  // Chunk text for embedding (8192 tokens ~ roughly 6000-7000 words)
  chunkText = (text) => {
    const maxChunkSize = 6000; // Rough estimate: 8192 tokens ~ 6000 words
    const words = text.split(/\s+/); // Split by whitespace
    const chunks = [];
    let currentChunk = [];

    for (const word of words) {
      currentChunk.push(word);
      if (currentChunk.length >= maxChunkSize) {
        chunks.push('search_document: ' + currentChunk.join(' '));
        currentChunk = [];
      }
    }

    // Add the last chunk if it has content
    if (currentChunk.length > 0) {
      chunks.push('search_document: ' + currentChunk.join(' '));
    }

    return chunks;
  };

  // Render file list
  renderFileList = () => {
    const { files } = this.state;
    return (
      <ul>
        {files.map((file, index) => (
          <li key={index}>{file.name}</li>
        ))}
      </ul>
    );
  };

  // Render extracted text
  renderExtractedText = () => {
    const { extractedText, chunks } = this.state;
    return (
      <div>
        <h2 className="subtitle">Extracted Text</h2>
        <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' }}>
          {extractedText || 'No text extracted yet.'}
        </pre>
        <h2 className="subtitle">Text Chunks for Embedding</h2>
        <ul>
          {chunks.map((chunk, index) => (
            <li key={index}>
              <strong>Chunk {index + 1}:</strong>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{chunk}</pre>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  render() {
    const { activeTab } = this.state;

    return (
      <section className="section">
        <div className="container">
          <h1 className="title">Document Management - Flamekeeper</h1>

          {/* Tabs */}
          <div className="tabs is-boxed">
            <ul>
              <li className={activeTab === 'upload' ? 'is-active' : ''}>
                <a onClick={() => this.handleTabChange('upload')}>Upload Files</a>
              </li>
              <li className={activeTab === 'view' ? 'is-active' : ''}>
                <a onClick={() => this.handleTabChange('view')}>View Text</a>
              </li>
            </ul>
          </div>

          {/* Tab Content */}
          {activeTab === 'upload' && (
            <div>
              <h2 className="subtitle">Upload Word Documents</h2>
              <DropzoneWrapper onDrop={this.onDrop} />
              <h3 className="subtitle">Selected Files:</h3>
              {this.renderFileList()}
            </div>
          )}

          {activeTab === 'view' && (
            <div>
              {this.renderExtractedText()}
            </div>
          )}
        </div>
      </section>
    );
  }
}

export default Documents;