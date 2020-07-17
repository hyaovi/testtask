import { Component } from "./Component.js";

export class Button extends Component {
  constructor(props = {}, ...args) {
    super(props, ...args);
  }

  button_click() {
    alert("Button clicked!");
  }
}
