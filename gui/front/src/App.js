import React, { Component } from 'react';
import { Routes, Route } from 'react-router-dom';
import Menu from './menu';
import Footer from './footer';
import Home from './home';
import Project from './project';
import NotFound from './notfound';
import CreateGPT from './createGPT';

class App extends Component {
  render() {
    return (
      <div className="app-container">
        <Menu />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<div className="section"><div className="container"><h1 className="title">Projects - Flamekeeper</h1><p>Project list coming soon...</p></div></div>} />
            <Route path="/projects/:id" element={<Project />} />
            <Route path="/create-gpt" element={<CreateGPT />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    );
  }
}

export default App;