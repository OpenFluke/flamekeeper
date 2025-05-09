import React, { Component, createRef } from "react";
import * as THREE from "three";

class SmokeEffect extends Component {
  constructor(props) {
    super(props);
    this.mountRef = createRef();
  }

  componentDidMount() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1000);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(width, height);
    this.mountRef.current.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const particles = 500;
    const positions = new Float32Array(particles * 3);

    for (let i = 0; i < particles * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 40;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 0.5,
      transparent: true,
      opacity: 0.2,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const animate = () => {
      points.rotation.y += 0.001;
      renderer.render(scene, camera);
      this.animationId = requestAnimationFrame(animate);
    };

    animate();
    this.renderer = renderer;
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.animationId);
    this.mountRef.current.removeChild(this.renderer.domElement);
  }

  render() {
    return (
      <div
        ref={this.mountRef}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
    );
  }
}

export default SmokeEffect;
