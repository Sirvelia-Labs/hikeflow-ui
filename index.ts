import { HikeConfig } from '../../hikeflow.config';

// Define interfaces for the component properties
interface ComponentProperties {
    name?: string;
    attributes?: Record<string, any>;
    clonedAttributes?: Record<string, string>;
    customizables?: Record<string, CustomizableOptions>;
    logic?: Record<string, (value: any, attributes: Record<string, any>) => any>;
    alpineComponents?: Record<string, Record<string, any>>;
    html?: string;
}

interface CustomizableOptions {
    fixedClasses?: string;
    classAttributes?: string[];
}

class HikeFlowComponent {
    constructor(componentProperties: ComponentProperties) {
        const elementName = componentProperties.name ?? 'default';
        const attributes = componentProperties.attributes ?? {};
        const clonedAttributes = componentProperties.clonedAttributes ?? {};
        const customizables = componentProperties.customizables ?? {};
        const logic = componentProperties.logic ?? {};
        const alpineComponents = componentProperties.alpineComponents ?? {};
        const html = componentProperties.html ?? '<div>{slot}</div>';

        window.customElements.define('h-' + elementName.toLowerCase(), class extends HTMLElement {
            private rendered: boolean = false;
            slotContents: Map<any, any>;

            constructor() {
                super();
                this.slotContents = new Map();
            }

            render(): void {
                if (!this.parentNode) return;

                // STORE SLOT CONTENTS IF NOT ALREADY STORED
                if (this.slotContents.size === 0) {
                    const slotElements = this.querySelectorAll('[slot]');
                    slotElements.forEach(el => {
                        this.slotContents.set(el.getAttribute('slot'), el.innerHTML);
                    });
                    this.slotContents.set('', this.innerHTML)
                }

                // PARSE HTML
                let parsedHTML = html;
                
                // MERGE ATTRIBUTES & CLONED ATTRIBUTES
                let mappedAttributes: Record<string, any> = {};
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
                        let final_value: any = mappedAttributes[attrName];
                        if (attrName in logic) final_value = logic[attrName](final_value, mappedAttributes);
                        return final_value;
                    }).join(' ');
                    parsedHTML = parsedHTML.replaceAll('ctm{' + varName + '}', `class="${options.fixedClasses ?? ''}${configClasses}${attributeClasses ? (' ' + attributeClasses) : ''}"`);
                });

                // PARSE ALPINE COMPONENTS
                const parseDirective = (directive: string): string => {
                    if (directive[0] === '@') return directive.replace('@', 'x-on:');
                    else if (directive[0] === ':') return directive.replace(':', 'x-bind:');
                    return directive;
                }

                const isJSON = (object: any): boolean => typeof object === 'object';
                let definedAttributes: Record<string, string> = {};
                for (let i = 0; i < this.attributes.length; i++) {
                    const attr = this.attributes[i];
                    definedAttributes[attr.nodeName] = attr.nodeValue ?? '';
                }

                Object.entries(alpineComponents).forEach(([componentName, alpineAttributes]) => {
                    let finalAttributes: Record<string, any> = { ...alpineAttributes };
                    Object.entries(definedAttributes).forEach(([attrName, attrVal]) => {
                        if (attrName.includes(componentName + '.')) finalAttributes[attrName.replace(componentName + '.', '')] = attrVal;
                        else if (attrName.includes(componentName + ':')) {
                            if (!('x-data' in finalAttributes)) finalAttributes['x-data'] = {};
                            if (isJSON(finalAttributes['x-data'])) finalAttributes['x-data'][attrName.replace(componentName + ':', '')] = `%%()=>${attrVal}%%`;
                        }
                    });

                    let parsedAlpine: string[] = [];
                    Object.entries(finalAttributes).forEach(([attrName, attrVal]) => {
                        let final_value: any = attrVal;
                        if (isJSON(final_value)) final_value = JSON.stringify(final_value, (_, value) => {
                            if (typeof value === 'function') {
                                return value.toString();
                            }
                            return value;
                        }).replaceAll('"', "'").replaceAll("'%%", '').replaceAll("%%'", '');

                        parsedAlpine.push(parseAttributes(`${parseDirective(attrName)}="${final_value}"`));
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
                parsedHTML = parsedHTML.replaceAll('{slot}', this.slotContents.get(''));

                // Update component inner content without replacing it
                this.innerHTML = parsedHTML;

                this.initializeAlpineComponent();
            }

            initializeAlpineComponent() {
                if (window.Alpine) {
                    window.Alpine.nextTick(() => {
                        window.Alpine.initTree(this);
                    })
                }
            }

            connectedCallback(): void {
                if (!this.rendered) {
                    this.render();
                    this.rendered = true;
                }
            }

            static get observedAttributes(): string[] {
                return Object.keys(attributes);
            }

            attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
                if (oldValue !== newValue) {
                    this.render();
                }
            }

            disconnectedCallback(): void {
                // Cleanup if necessary
            }
        });
    }
}

export default HikeFlowComponent;