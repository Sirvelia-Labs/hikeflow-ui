import { HikeConfig } from '../../hikeflow.config.js';

class HikeFlowComponent {
    constructor(componentProperties) {

        const elementName       = componentProperties.name              ?? 'default';
        const attributes        = componentProperties.attributes        ?? {};
        const clonedAttributes  = componentProperties.clonedAttributes  ?? {};
        const customizables     = componentProperties.customizables     ?? {};
        const logic             = componentProperties.logic             ?? {};
        const alpineComponents  = componentProperties.alpineComponents  ?? {};
        const html              = componentProperties.html              ?? '<div>{slot}</div>';

        window.customElements.define('h-' + elementName.toLowerCase(), class extends HTMLElement {
            constructor() {
                super();
                this.slotContents = new Map();
            }

            render() {

                if (!this.parentNode) return;

                // STORE SLOT CONTENTS IF NOT ALREADY STORED
                if (this.slotContents.size === 0) {
                    const slotElements = this.querySelectorAll('[slot]');
                    slotElements.forEach(el => {
                        this.slotContents.set(el.getAttribute('slot'), el.innerHTML);
                    });
                }

                // PARSE HTML
                let parsedHTML = html;
                
                // MERGE ATTRIBUTES & CLONED ATTRIBUTES
                let mappedAttributes = {};
                Object.entries(attributes).forEach(([attrName, defaultValue]) => {
                    mappedAttributes[attrName] = this.getAttribute(attrName) || defaultValue;
                });
                Object.entries(clonedAttributes).forEach(([attrName, refName]) => {
                    mappedAttributes[attrName] = this.getAttribute(refName) || attributes[refName];
                });

                // PARSE ATTRIBUTES
                const parseAttributes = (text) => {
                    return text.replace(/attr{(\w+)}/g, (match, attrName) => {
                        let final_value = mappedAttributes[attrName];
                        if (attrName in logic) final_value = logic[attrName](final_value, mappedAttributes);
                        return final_value;
                    });
                };
                parsedHTML = parseAttributes(parsedHTML);

                // PARSE CUSTOMIZABLES
                Object.entries(customizables).forEach(([varName, options]) => {
                    let configClasses = ((elementName in HikeConfig) && (varName in HikeConfig[elementName])) ? (' ' + HikeConfig[elementName][varName]) : "";
                    const classAttributes = options.classAttributes ?? [];
                    let attributeClasses = classAttributes.map((attrName) => {
                        let final_value = mappedAttributes[attrName];
                        if (attrName in logic) final_value = logic[attrName](final_value, mappedAttributes);
                        return final_value;
                    }).join(' ');
                    parsedHTML = parsedHTML.replaceAll('ctm{' + varName + '}', `class="${ options.fixedClasses ?? '' }${ configClasses }${ attributeClasses ? (' ' + attributeClasses) : '' }"`);
                });

                // PARSE ALPINE COMPONENTS
                const parseDirective = (directive) => {
                    if (directive[0] === '@') return directive.replace('@', 'x-on:');
                    else if (directive[0] === ':') return directive.replace(':', 'x-bind:');
                    return directive;
                }
                const isJSON = (object) => typeof object === 'object';
                let definedAttributes = {};
                for (let i = 0; i < this.attributes.length; i++) definedAttributes[this.attributes[i].nodeName] = this.attributes[i].nodeValue;
                Object.entries(alpineComponents).forEach(([componentName, alpineAttributes]) => {
                    let finalAttributes = alpineAttributes;
                    Object.entries(definedAttributes).forEach(([attrName, attrVal]) => {
                        if (attrName.includes(componentName + '.')) finalAttributes[attrName.replace(componentName + '.', '')] = attrVal;
                        else if (attrName.includes(componentName + ':')) {
                            if (!('x-data' in finalAttributes)) finalAttributes['x-data'] = {};
                            if (isJSON(finalAttributes['x-data'])) finalAttributes['x-data'][attrName.replace(componentName + ':', '')] = `%%()=>${attrVal}%%`;
                        }
                    });
                    let parsedAlpine = [];
                    Object.entries(finalAttributes).forEach(([attrName, attrVal]) => {
                        let final_value = attrVal;
                        if (isJSON(final_value)) final_value = JSON.stringify(final_value, (_, value) => {
                            if (typeof value === 'function') {
                                return value.toString();
                            }
                            return value;
                        }).replaceAll('"', "'").replaceAll("'%%", '').replaceAll("%%'", '');
                        parsedAlpine.push(parseAttributes(`${ parseDirective(attrName) }="${ final_value }"`));
                    });
                    parsedHTML = parsedHTML.replaceAll('alpine{' + componentName + '}', parsedAlpine.join(' '));
                });

                // PARSE INNER HTML SLOTS
                const slotRegex = /{slot:(\w+)}/g;
                let match;
                while ((match = slotRegex.exec(parsedHTML)) !== null) {
                    const slotName = match[1]
                    const slotContent = this.slotContents.get(slotName) || '';
                    parsedHTML = parsedHTML.replace(match[0], slotContent)
                }
                parsedHTML = parsedHTML.replaceAll('{slot}', this.innerHTML);

                this.innerHTML = parsedHTML
            }

            connectedCallback() {
                if (!this.rendered) {
                    this.render();
                    this.rendered = true;
                }
            }

            static get observedAttributes() {
                return Object.keys(attributes);
            }

            attributeChangedCallback(name, oldValue, newValue) {
                this.render();
            }
        });
    }

}

export default HikeFlowComponent