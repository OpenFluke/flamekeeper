import React, { Component } from "react";
import FireSmokeOrbEffect from "./FireSmokeOrbEffect";

class EffectBackground extends Component {
  render() {
    const { effectId } = this.props;
    switch (effectId) {
      case 1:
        return <FireSmokeOrbEffect />;
      default:
        return null;
    }
  }
}

export default EffectBackground;
