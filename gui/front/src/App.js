import React, { Component } from "react";
import { Routes, Route, Link } from "react-router-dom";
import Menu from "./menu";
import Footer from "./footer";
import Home from "./home";
import Project from "./project";
import NotFound from "./notfound";
import CreateGPT from "./createGPT";
import TestPage from "./TestPage";
import DeployPage from "./DeployPage";

class App extends Component {
  constructor(props) {
    super(props);

    // Extract protocol and hostname from current location (ignores port)
    const { protocol, hostname } = window.location;
    this.serverBase = `${protocol}//${hostname}`;

    this.state = {
      projects: [],
      fetchError: "",
    };
  }

  componentDidMount() {
    this.fetchProjects();
  }

  fetchProjects = async () => {
    try {
      const response = await fetch(`${this.serverBase}:4000/api/projects`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch projects: ${response.status} ${response.statusText}`
        );
      }
      const data = await response.json();
      if (data.success) {
        this.setState({ projects: data.projects || [], fetchError: "" });
      } else {
        this.setState({
          fetchError: data.message || "Failed to fetch projects",
          projects: [],
        });
      }
    } catch (error) {
      this.setState({ fetchError: error.message, projects: [] });
      console.error("Error fetching projects:", error);
    }
  };

  renderProjects = () => {
    const { projects, fetchError } = this.state;

    return (
      <div className="section">
        <div className="container">
          <h1 className="title">Projects - Flamekeeper</h1>
          {fetchError && (
            <div className="notification is-danger">{fetchError}</div>
          )}
          {(!projects || projects.length === 0) && !fetchError ? (
            <p>No projects found. Create a new GPT to start a project.</p>
          ) : (
            <div className="columns is-multiline">
              {projects.map((project, index) => (
                <div key={index} className="column is-4">
                  <div className="box">
                    <h3 className="subtitle">{project.name}</h3>
                    <p>{project.description}</p>
                    <div className="buttons mt-2">
                      <Link
                        to={`/projects/${project.projectid}`}
                        className="button is-primary"
                      >
                        View Project
                      </Link>
                      <Link
                        to={`/deploy/${project.projectid}`}
                        className="button is-link"
                      >
                        Deploy
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  render() {
    const { serverBase } = this;

    return (
      <div className="app-container">
        <Menu />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home serverBase={serverBase} />} />
            <Route path="/projects" element={this.renderProjects()} />
            <Route
              path="/projects/:id"
              element={<Project serverBase={serverBase} />}
            />
            <Route
              path="/create-gpt"
              element={<CreateGPT serverBase={serverBase} />}
            />
            <Route
              path="/test/:id"
              element={<TestPage serverBase={serverBase} />}
            />
            <Route
              path="/deploy/:projectid"
              element={<DeployPage serverBase={serverBase} />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    );
  }
}

export default App;
