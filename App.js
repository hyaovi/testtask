import { Component } from "./Component.js";

export class App extends Component {
  constructor(props = {}, ...args) {
    super(props, ...args);
  }

  app_load() {
    alert("App loaded!");
  }
}
