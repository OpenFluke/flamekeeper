import React, { Component, createRef } from "react";

class FireBackground extends Component {
  constructor(props) {
    super(props);
    this.canvasRef = createRef();
    this.animationId = null;
    this.firePixels = [];
    this.width = 100;
    this.height = 60;
  }

  componentDidMount() {
    if (this.props.effectId === 1) {
      this.initFire();
      this.animationId = requestAnimationFrame(this.updateFire);
    }
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.animationId);
  }

  initFire = () => {
    const canvas = this.canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    this.width = Math.floor(canvas.width / 4);
    this.height = Math.floor(canvas.height / 4);
    const totalPixels = this.width * this.height;

    this.firePixels = new Array(totalPixels).fill(0);

    for (let x = 0; x < this.width; x++) {
      this.firePixels[(this.height - 1) * this.width + x] = 36;
    }

    this.ctx = ctx;
  };

  updateFire = () => {
    const { firePixels, width, height, ctx, canvasRef } = this;
    const palette = [
      "#070707",
      "#1F0707",
      "#2F0F07",
      "#470F07",
      "#571707",
      "#671F07",
      "#771F07",
      "#8F2707",
      "#9F2F07",
      "#AF3F07",
      "#BF4707",
      "#C74707",
      "#DF4F07",
      "#DF5707",
      "#DF5707",
      "#D75F07",
      "#D7670F",
      "#CF6F0F",
      "#CF770F",
      "#CF7F0F",
      "#CF8717",
      "#C78717",
      "#C78F17",
      "#C7971F",
      "#BF9F1F",
      "#BF9F1F",
      "#BFA727",
      "#BFA727",
      "#BFAF2F",
      "#B7AF2F",
      "#B7B72F",
      "#B7B737",
      "#CFCF6F",
      "#DFDF9F",
      "#EFEFC7",
      "#FFFFFF",
    ];

    for (let x = 0; x < width; x++) {
      for (let y = 1; y < height; y++) {
        const src = y * width + x;
        const decay = Math.floor(Math.random() * 3);
        const dst = src - decay + 1;
        const intensity = firePixels[src] - (decay & 1);
        if (dst >= 0 && dst < firePixels.length) {
          firePixels[dst - width] = intensity > 0 ? intensity : 0;
        }
      }
    }

    const imgData = ctx.createImageData(width, height);
    for (let i = 0; i < firePixels.length; i++) {
      const colorIndex = firePixels[i];
      const hex = palette[colorIndex] || "#000000";
      const [r, g, b] = hex.match(/\w\w/g).map((v) => parseInt(v, 16));
      const pixelIndex = i * 4;
      imgData.data[pixelIndex] = r;
      imgData.data[pixelIndex + 1] = g;
      imgData.data[pixelIndex + 2] = b;
      imgData.data[pixelIndex + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0, 0, 0, width * 4, height * 4);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      this.canvasRef.current,
      0,
      0,
      width,
      height,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    this.animationId = requestAnimationFrame(this.updateFire);
  };

  render() {
    return (
      <canvas
        ref={this.canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
    );
  }
}

export default FireBackground;
