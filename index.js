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

            render() {

                if (!this.parentNode) return;

                // PARSE HTML
                let parsedHTML = html;
                let mappedAttributes = {};

                // TODO: LET THE USER SPECIFY A LIST OF LOGIC FUNCTIONS, AND REFER THEM WITH AN INDEX. AND AUTOMATICALLY CREATE ANONYMOUS CLONED ATTRIBUTES
                // MERGE ATTRIBUTES & CLONED ATTRIBUTES
                Object.entries(attributes).forEach(([attrName, defaultValue]) => {
                    mappedAttributes[attrName] = this.getAttribute(attrName) || defaultValue;
                });
                Object.entries(clonedAttributes).forEach(([attrName, refName]) => {
                    mappedAttributes[attrName] = this.getAttribute(refName) || attributes[refName];
                });

                // PARSE ATTRIBUTES
                Object.entries(mappedAttributes).forEach(([attrName, value]) => {
                    let final_value = value;
                    if (attrName in logic) final_value = logic[attrName](value, mappedAttributes);
                    parsedHTML = parsedHTML.replaceAll('attr{' + attrName + '}', final_value);
                });

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
                        if (attrName.includes(componentName + '-')) finalAttributes[attrName.replace(componentName + '-', '')] = attrVal;
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
                        parsedAlpine.push(`${ parseDirective(attrName) }="${ final_value }"`);
                    });
                    parsedHTML = parsedHTML.replaceAll('alpine{' + componentName + '}', parsedAlpine.join(' '));
                });

                // PARSE INNERHTML
                parsedHTML = parsedHTML.replaceAll('{slot}', this.innerHTML);

                this.outerHTML = parsedHTML
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