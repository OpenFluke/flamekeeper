import React, { Component } from 'react';
import { withRouter } from './withRouter';

class CreateGPT extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      description: '',
      message: '',
      canCreate: null,
    };
  }

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value, message: '', canCreate: null });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { name, description } = this.state;
    if (!name || !description) {
      this.setState({ message: 'Please fill in both the name and description.', canCreate: false });
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/gpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      const data = await response.json();
      if (!data.success) {
        this.setState({ message: data.message, canCreate: data.canCreate });
        return;
      }

      this.setState({ message: data.message, canCreate: data.canCreate });
      // Redirect to the project page after a short delay to show the success message
      setTimeout(() => {
        this.props.navigate(`/projects/${data.projectid}`);
      }, 1000);
    } catch (error) {
      this.setState({ message: 'Failed to connect to the backend: ' + error.message, canCreate: false });
    }
  };

  render() {
    const { name, description, message, canCreate } = this.state;

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

            {message && (
              <div className={`notification ${canCreate ? 'is-success' : 'is-danger'}`}>
                {message}
              </div>
            )}
          </form>
        </div>
      </section>
    );
  }
}

export default withRouter(CreateGPT);