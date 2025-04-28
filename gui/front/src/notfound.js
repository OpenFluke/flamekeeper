import React, { Component } from 'react';

class NotFound extends Component {
  render() {
    return (
      <section className="section">
        <div className="container">
          <h1 className="title">404 - Page Not Found</h1>
          <p className="subtitle">The page you're looking for doesn't exist.</p>
        </div>
      </section>
    );
  }
}

export default NotFound;