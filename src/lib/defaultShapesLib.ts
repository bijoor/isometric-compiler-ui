import { Shape } from '../Types';

export const defaultShapesLibrary: Shape[] = [
  {
    name: "layer4x3",
    svgFile: "layer4x3.svg",
    type: "3D",
    attachTo: ""
  },
  {
    name: "microservice",
    svgFile: "cubical-base.svg",
    type: "3D",
    attachTo: ""
  },
  {
    name: "application",
    svgFile: "cuboidal-base.svg",
    type: "3D",
    attachTo: ""
  },
  {
    name: "database",
    svgFile: "cylinder.svg",
    type: "3D",
    attachTo: ""
  },
  {
    name: "monitor",
    svgFile: "monitor.svg",
    type: "3D",
    attachTo: ""
  },
  {
    name: "process",
    svgFile: "process2D.svg",
    type: "2D",
    attachTo: "top"
  },
  {
    name: "grill-left",
    svgFile: "grill-left2D.svg",
    type: "2D",
    attachTo: "front-left"
  },
  {
    name: "grill-right",
    svgFile: "grill-right2D.svg",
    type: "2D",
    attachTo: "front-right"
  },
  {
    name: "dial-left",
    svgFile: "dial-left2D.svg",
    type: "2D",
    attachTo: "front-left"
  },
  {
    name: "ai-model",
    svgFile: "ai-model2D.svg",
    type: "2D",
    attachTo: "top"
  },
  {
    name: "bits-on-screen",
    svgFile: "bits-on-screen2D.svg",
    type: "2D",
    attachTo: "screen"
  },
];