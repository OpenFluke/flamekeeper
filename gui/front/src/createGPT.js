import React, { Component } from 'react';
import { withRouter } from './withRouter';

class CreateGPT extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      description: '',
    };
  }

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    const { name, description } = this.state;
    if (!name || !description) {
      alert('Please fill in both the name and description.');
      return;
    }

    // Generate a projectid from the name (replace spaces with hyphens, lowercase)
    const projectid = name.toLowerCase().replace(/\s+/g, '-');
    
    // For now, we'll just redirect to the project page
    // Later, you'll send this to the backend
    this.props.navigate(`/projects/${projectid}`);
  };

  render() {
    const { name, description } = this.state;

    return (
      <section className="section">
        <div className="container">
          <h1 className="title">Create a New GPT - Flamekeeper</h1>
          <form onSubmit={this.handleSubmit}>
            <div className="field">
              <label className="label">GPT Name</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  name="name"
                  value={name}
                  onChange={this.handleInputChange}
                  placeholder="Enter GPT name"
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Description</label>
              <div className="control">
                <textarea
                  className="textarea"
                  name="description"
                  value={description}
                  onChange={this.handleInputChange}
                  placeholder="Enter a description for your GPT"
                />
              </div>
            </div>

            <div className="field">
              <div className="control">
                <button className="button is-primary" type="submit">
                  Create GPT
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>
    );
  }
}

export default withRouter(CreateGPT);