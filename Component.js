export class Component {
  static assoc = {};

  constructor(props = {}) {
    this.template_content = undefined;
    this.template_file = undefined;
    Object.assign((this.props = {}), props);
  }

  get dom() {
    return new Promise((rv) => {
      this.template.then((template) => {
        console.log({ template });
        rv(new DOMParser().parseFromString(template, "text/html"));
      });
    });
  }

  get template() {
    return new Promise((rv) => {
      if (this.template_content) {
        rv(this.template_content);
        return;
      }
      this.template_file = this.template_file
        ? this.template_file
        : "./" + this.constructor.name + ".html";
      fetch(this.template_file).then((resp) => {
        resp.text().then((text) => {
          this.template_content = text;
          rv(this.template_content);
        });
      });
    });
  }

  async _get(name) {
    if (typeof this.props[name] !== "undefined") return this.props[name];
    return this[name];
  }

  async _get_value(name) {
    let r = await this._get(name);
    if (r === undefined) {
      try {
        r = JSON.parse(name);
      } catch (e_json) {
        try {
          r = eval(a.value);
        } catch (e_eval) {}
      }
    }
    return r;
  }

  async renderString(s) {
    let off = 0;
    for (let m of Array.from(s.matchAll(/\{\{([^\}]*)\}\}/g))) {
      let [match, expr] = m;
      console.log({ match, expr });
      s = s.replace(match, await this._get_value(expr));
    }
    return s;
  }

  async parseAttributes(attributes) {
    const o = {};
    await Promise.all(
      Array.from(attributes).map(async (a) => {
        let name1 = a.name.slice(1);
        switch (a.name[0]) {
          case "@":
            // event
            (o._events || (o._events = {}))[name1] = await this._get(a.value);
            break;
          case ":":
            // reactive prop
            o[name1] = await this._get_value(a.value);
            break;
          default:
            // prop
            o[a.name] = a.value;
        }
      })
    );
    return o;
  }

  async renderChilds(parent) {
    for (let node of parent.childNodes) {
      switch (node.nodeType) {
        case 1: // tag
          const tag = node.tagName.toLowerCase(),
            tag_class = this.constructor.assoc[tag],
            props = await this.parseAttributes(node.attributes);

          console.log({ tag, props });

          if (tag_class) {
            await new tag_class(props).render(node);
          } else {
            console.log({ node });
            await this.renderChilds(node);

            //debugger;
          }
          break;
        case 3: // text
          node.nodeValue = await this.renderString(node.nodeValue);
          break;
      }
    }
  }

  async renderWithBody(element, body) {
    await this.renderChilds(body);
    element.replaceWith(...Array.from(body.childNodes));
  }

  async render(element) {
    const dom = await this.dom;
    await this.renderWithBody(element, dom.body);
  }
}
