export class Component {
  static assoc = {};

  constructor(props = {}) {
    this.template_content = undefined;
    this.template_file = undefined;

    Object.assign((this.props = {}), props);
    // console.log({ props: Object.assign((this.props = {}), props) });
  }

  get dom() {
    // RETURNS A DOM document by parsing template with DOMPARSER
    return new Promise((rv) => {
      this.template.then((template) => {
        // console.log({
        //   DOMParser: new DOMParser().parseFromString(template, 'text/html'),
        // });
        rv(new DOMParser().parseFromString(template, 'text/html'));
      });
    });
  }

  get template() {
    // RETURN A LITTERAL (STRING) CONTENT FETCHED FROM THE COMPONENT'S HTML FILE
    return new Promise((rv) => {
      if (this.template_content) {
        rv(this.template_content);
        return;
      }
      this.template_file = this.template_file
        ? this.template_file
        : './' + this.constructor.name + '.html';
      // console.log(this.template_file);
      fetch(this.template_file).then((resp) => {
        resp.text().then((text) => {
          this.template_content = text;
          // console.log({ template_content: this.template_content });

          rv(this.template_content);
        });
      });
    });
  }

  async _get(name) {
    if (typeof this.props[name] !== 'undefined') return this.props[name];
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
    // PARSE DE PROPS AND REPLACE THEM BY THE PROPER VALUE
    let off = 0;
    for (let m of Array.from(s.matchAll(/\{\{([^\}]*)\}\}/g))) {
      let [match, expr] = m;
      s = s.replace(match, await this._get_value(expr));
    }

    return s;
  }

  async parseAttributes(node) {
    // COLLECTES ALL ATTIBUTES & TREAT THEM OR CLASSIFIY INTO "O" OBJECT
    const o = {};
    const { attributes } = node;
    // console.log(attributes);
    // console.log(node);
    await Promise.all(
      Array.from(attributes).map(async (a) => {
        let name1 = a.name.slice(1);
        // console.log(name1, a.value);
        switch (a.name[0]) {
          case '@':
            // event
            (o._events || (o._events = {}))[name1] = await this._get(a.value);
            node.addEventListener(name1, this[a.value]);
            node.removeAttribute(a.name); //REMOVE OLD ONE

            break;
          case ':':
            // reactive prop

            node.setAttribute(name1, a.value); //ADD
            node.removeAttribute(a.name); //REMOVE OLD ONE

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
      // console.log(node);

      switch (node.nodeType) {
        case 1: // tag
          const tag = node.tagName.toLowerCase(),
            tag_class = this.constructor.assoc[tag],
            props = await this.parseAttributes(node);

          if (tag_class) {
            await new tag_class(props).render(node);
          } else {
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
    console.log(body.childNodes);
    await this.renderChilds(body);
    element.replaceWith(...Array.from(body.childNodes));
  }

  async render(element) {
    const dom = await this.dom;
    await this.renderWithBody(element, dom.body);
  }
}
