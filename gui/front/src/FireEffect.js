import React, { Component, createRef } from "react";
import * as THREE from "three";

class FireEffect extends Component {
  constructor(props) {
    super(props);
    this.mountRef = createRef();
  }

  componentDidMount() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
    camera.position.z = 2;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(width, height);
    this.mountRef.current.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(2, 2);

    const uniforms = {
      u_time: { value: 0.0 },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      fragmentShader: `
        uniform float u_time;
        void main() {
          float strength = sin(u_time + gl_FragCoord.y * 0.02) * 0.5 + 0.5;
          gl_FragColor = vec4(strength, strength * 0.2, 0.0, 0.3);
        }
      `,
      transparent: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const animate = () => {
      uniforms.u_time.value += 0.03;
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

export default FireEffect;
