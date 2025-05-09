import React, { Component, createRef } from "react";
import * as THREE from "three";

class FireSmokeOrbEffect extends Component {
  constructor(props) {
    super(props);
    this.mountRef = createRef();
    this.orbY = 0;
    this.up = true;
  }

  componentDidMount() {
    this.initScene();
    this.animate();
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.frameId);
    this.renderer.dispose();
    this.mountRef.current.removeChild(this.renderer.domElement);
  }

  initScene() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 6;

    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setSize(width, height);
    this.mountRef.current.appendChild(this.renderer.domElement);

    // Orb
    const orbGeometry = new THREE.SphereGeometry(1.2, 64, 64);
    const orbMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      transparent: true,
      fragmentShader: `
        uniform float uTime;
        void main() {
          float glow = 0.5 + 0.5 * sin(uTime + gl_FragCoord.y * 0.02);
          gl_FragColor = vec4(glow, glow * 0.3, 0.05, 0.5);
        }
      `,
      vertexShader: `
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
    });
    this.orb = new THREE.Mesh(orbGeometry, orbMaterial);
    this.scene.add(this.orb);

    // Smoke particles
    const smokeGeometry = new THREE.BufferGeometry();
    const smokeCount = 1000;
    const positions = new Float32Array(smokeCount * 3);
    for (let i = 0; i < smokeCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 5;
    }
    smokeGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    const smokeMaterial = new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 0.15,
      transparent: true,
      opacity: 0.2,
    });

    this.smoke = new THREE.Points(smokeGeometry, smokeMaterial);
    this.scene.add(this.smoke);

    this.clock = new THREE.Clock();
  }

  animate = () => {
    const elapsed = this.clock.getElapsedTime();

    // Update uniform for glowing effect
    this.orb.material.uniforms.uTime.value = elapsed;

    // Animate orb Y-position up/down like "breathing"
    if (this.up) {
      this.orbY += 0.005;
      if (this.orbY > 0.3) this.up = false;
    } else {
      this.orbY -= 0.005;
      if (this.orbY < -0.3) this.up = true;
    }
    this.orb.position.y = this.orbY;

    // Subtle smoke rotation
    this.smoke.rotation.y += 0.0005;
    this.smoke.rotation.x += 0.0002;

    this.renderer.render(this.scene, this.camera);
    this.frameId = requestAnimationFrame(this.animate);
  };

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

export default FireSmokeOrbEffect;
