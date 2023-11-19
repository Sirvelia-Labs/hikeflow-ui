# Hikeflow

The new Alpine-based reactive component library!

# Get Started

1. Install the library in your project: 
   
   With NPM:
   
        npm install hikeflow

    Or with Yarn:

        yarn add hikeflow

2. Initialize the library:

        npx hikeflow init


    This will create a `hikeflow.config.js` file where you can create a theme for your project using the *customizables* property.

3. Import and start [AlpineJS](https://alpinejs.dev/) in your main javascript file:

        import Alpine from 'alpinejs'

        //...

        Alpine.start();

4. Import the `HikeFlowComponent` class in your preferred JS file:


        import HikeFlowComponent from 'hikeflow'

5. Start defining your components!

        new HikeFlowComponent({
            name: 'hello-world',
            //...
        })

6. Call the new component in your HTML:
   
        ...
        <h-hello-world></h-hello-world>
        ...

# HikeFlow Properties

Hikeflow has different properties which lets you define any component you like. Some of this attributes are modifiable directly from the HTML, or from the `hikeflow.config.js` file.

## name (required)

Defines the name of the component, which can be called from the HTML.

        new HikeFlowComponent({
            name: 'example',
            //...
        })

When called, all HikeFlow components have a 'h-' prefix to avoid compatibility issues with other component libraries.

        <h-example ...></h-example>

## attributes

In **attributes**, you can specify different attributes for your component. To define an attribute in the properties object, you need to set a key which will be the attribute name, and a value which will be the default value of the attribute if the user doesn't set this attribute in your component.

        new HikeFlowComponent({
            name: 'example'
            attributes: {
                test: false
            }
        })

It can be directly accessed from the HTML:

        <h-example test="true"></h-example>

## clonedAttributes

This property lets you create a *pointer* attribute, which points to the value of another attribute. To create a cloned attribute, all you need is to set a key which will be the name of the cloned attribute, and a value, which is the attribute name to clone. This is extremely handy when combined with the **logic** property, as it lets you define different logics for a single attribute value.

        new HikeFlowComponent({
            //...
            attributes: {
                test: false
            },
            clonedAttributes: {
                new_test: 'test'
            }
        })

## logic

The **logic** property lets you alter the values of the defined attributes after the user has defined them in the HTML, and before they have been rendered. When you render your attributes in the **html** property, they will contain the return value of your logic functions.

You can define a single custom logic function for each attribute. However, you have different ways to create more than one custom logic function for an attribute. In order to avoid the need of conditionals to solve this issue, the **clonedAttributes** property can be used to define multiple logic functions for a single attribute value.

To create a custom logic function for an attribute, you will need to set a key with the name of the attribute, and a value, which is a function with your defined logic. The defined function can have one parameter, which will get the attribute value, or it also have a second parameter, which will contain an object with all the component's attributes and their values.

        new HikeFlowComponent({
            //...
            attributes: {
                theme: 'light',
                'hide-black-box': true
            },
            logic: {
                theme: (theme_value) => theme_value === 'light' ? '#FFFFFF' : '#000000',
                'hide-black-box': (hide, attributes) => {
                    if (hide && attributes['theme'] === 'light') {
                        return 'display: none';
                    }
                    return '';
                }
            }
        })

## customizables

This property lets you define different customizable parts of your component. This way, your components can be adapted to fit better in different designs and use cases.

Each customizable part defined in your code is referenced by a name (as the object key), and is composed of three main parts:

1. **fixedClasses**: This property lets you define a set of classes which are *fixed* in your component, and cannot be changed by any user. This property helps avoiding any possible alteration of the component's main functionality related to its classes.

        new HikeFlowComponent({
            //...
            customizables: {
                'customizable-example': {
                    fixedClasses: "relative"
                }
            }
        })

2. **classAttributes**: This property lets you define a list of defined attributes. Their values will be appended into the component's classes. If the **logic** property is used with an attribute included as a **classAttribute**, the value appended into the component's classes will be the output value of the attribute's logic function.

        new HikeFlowComponent({
            //...
            attributes: {
                required: true,
                value: ''
            },
            logic: {
                required: (required, attributes) => {
                    if (required && !attributes['value']) {
                        return 'border-2 border-red-500';
                    }
                    return '';
                }
            }
            customizables: {
                'customizable-example': {
                    classAttributes: ['required']
                }
            }
        })

3. **The Theme Properties**: When using hikeflow, you need to create a `hikeflow.config.js` file by executing the `npx hikeflow init` command. In this file, you can define a theme for your current project. The theme is defined by defining additional classes for each customizable part of your component.

        export const HikeConfig = {
            'example': { // The name of your component
                'customizable-example': 'bg-white border-solid'
            }
        }

## alpineComponents

The components of HikeFlow can have reactive behavior. To make this possible, HikeFlow makes use of the [AlpineJS](https://alpinejs.dev/) library.

In HikeFlow, the reactive parts of your component are defined separately, assigning a name to each of this parts. Inside a reactive part, you can reference any AlpineJS directive (as the object key), and its value.

        new HikeFlowComponent({
            //...
            alpineComponents: {
                modal: {
                    'x-data': {
                        open: false
                    },
                    '@click': () => { open = !open; }
                }
            }
        })

Just like attributes, the different properties in the reactive parts of a HikeFlow component can be redefined from within the HTML. The data values can be accessed using the `:` operator after the reactive part's name, and the other directives by using the `.` operator.

        <h-example modal:open="true" modal.@click="() => { console.log('closed modal'); }"></h-example>

To ensure a correct reactivity, you can replace a reactive part's data with an AlpineJS data variable defined in an outer scope, and it will change dynamically, following the outer variable changes.

        <div x-data="{ outer_modal_open: false }">
            <button @click="outer_modal_open = !outer_modal_open">
                Toggle modal
            </button>
            <h-example modal:open="outer_modal_open"></h-example>
        </div>

## html (required)

The **html** property defines how a component is rendered. It consists of a string with the HTML of the component. To work with the different properties of the defined component, HikeFlow has a set of useful directives. Almost all of the directives are called by the directive's name, followed by a pair of brackets (`{}`) which enclose a value. To avoid any parsing issues, it is recommended to use the backtick character (\`) to define the component's HTML.

- **attr{ATTRIBUTE_NAME}**: It references the final value of a defined attribute. If no value is defined in the HTML, the attribute's default value will be used. If there exists a logic function for the given attribute, the function's result will be the directive's output.

        new HikeFlowComponent({
            name: 'example',
            attributes: {
                type: 'text',
                'show-submit-button': false
            },
            logic: {
                'show-submit-button': (show) => {
                    if (show) {
                        return `<button type="submit">OK</button>`;
                    }
                    return ``;
                }
            },
            html: `
                <input type="attr{type}" />
                attr{show-submit-button}
            `
        })

- **ctm{CUSTOMIZABLE_NAME}**: It references to a component's customizable part. It needs to be defined inside an HTML tag, as it will render as its `class` property. The rendering order of customizables is the following:
    1. First, the `fixedClasses` of the component are rendered.
    2. Second, the `Theme Classes` of the component (defined in the `hikeflow.config.js` file) are rendered.
    3. Lastly, the `classAttributes` of the component are rendered.

    It is very easy to call a customizable in the **html** property: 

        new HikeFlowComponent({
            //...
            customizables: {
                example: {
                    fixedClasses: 'bg-black',
                    classAttributes: ['theme']
                }
            },
            html: `
                <div ctm{example}></div>
            `
        })

- **alpine{ALPINE_COMPONENT_NAME}**: It references to a component's reactive part. It needs to be defined inside an HTML tag, as it will render as a set of AlpineJS directives. When rendered, the `:` and `@` AlpineJS shorthands will be replaced for `x-bind:` and `x-on:` respectively to avoid any problems.

        new HikeFlowComponent({
            //...
            alpineComponents: {
                example: {
                    'x-data': {
                        open: false
                    },
                    'x-text': 'open ? "Open" : "Closed"',
                    '@click': () => { open = !open; }
                }
            },
            html: `
                <div>
                    <button alpine{example}>
                    </button>
                </div>
            `
        })

- **{slot}**: It references the inner HTML of the component. If **{slot}** is defined in the component, you can add HTML inside the component, and it will be rendered in its place.

        new HikeFlowComponent({
            name: 'example',
            //...
            html: `
                <div>
                    {slot}
                </div>
            `
        })

    When called in the HTML:

        <h-example>
            Hello World!
        </h-example>

    This will be rendered:

        <div>
            Hello World!
        </div>

# Render flow

The render flow of the multiple properties of a HikeFlow component follows a strategic order to make possible a set of different handy use cases. HikeFlow's directives are rendered in the following order:

1. In first place, the component's attributes are obtained, assigning their default value to those which have not been assigned by the user.
2. In second place, the component's attributes are rendered. If any attribute has a logic function, it is called just before its rendering, placing the function's output in the HTML.
3. Next, the customizables are rendered following the rendering flow specified in the **customizables** section.
4. After the customizables, the AlpineJS reactive parts are rendered.
5. Finally, the **{slot}** directive is replaced by the component's inner HTML.

This render flow makes possible, for example, creating customizables, AlpineJS reactive parts and placing the **{slot}** directive inside an attribute's logic function. Example:

        new HikeFlowComponent({
            name: 'search-bar',
            attributes: {
                icon: '',
                'icon-classes': ''
            },
            logic: {
                icon: (icon) => icon ? `
                    <img src="${icon}" ctm{icon} alpine{icon} />
                ` : ``
            },
            customizables: {
                icon: {
                    fixedClasses: 'absolute',
                    classAttributes: ['icon-classes']
                }
            },
            alpineComponents: {
                'x-data': {
                    click_action: () => false
                },
                '@click': 'click_action()'
            },
            html: `
                <div class="relative">
                    attr{icon}
                    <input type="text" />
                </div>
            `
        })