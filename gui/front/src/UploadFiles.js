import React, { Component } from 'react';
import { useDropzone } from 'react-dropzone';
import mammoth from 'mammoth';

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

class UploadFiles extends Component {
  constructor(props) {
    super(props);
    this.state = {
      files: [], // Store uploaded files for this project
    };
  }

  // Handle file selection (both drag-and-drop and button click)
  onDrop = async (acceptedFiles) => {
    const newFiles = [...this.state.files, ...acceptedFiles];
    this.setState({ files: newFiles }, async () => {
      this.props.onFilesChange(newFiles);

      // Extract text from the files
      let combinedText = '';
      for (const file of newFiles) {
        if (file.name.endsWith('.docx')) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          combinedText += result.value + '\n\n';
        }
      }
      this.props.onExtractedTextChange(combinedText);
    });
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

  render() {
    const { projectId } = this.props;
    return (
      <div>
        <h2 className="subtitle">Upload Word Documents for Project {projectId}</h2>
        <DropzoneWrapper onDrop={this.onDrop} />
        <h3 className="subtitle">Selected Files:</h3>
        {this.renderFileList()}
      </div>
    );
  }
}

export default UploadFiles;