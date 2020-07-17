// run the setup from the vs_code_comm.js file
setupHtmlSide()
// see: retainContextWhenHidden

// Listen to actions from the extension
window.addEventListener("message", eventObj => {
    if (eventObj instanceof Object && eventObj.data instanceof Object) {
        switch (eventObj.data.command) {
            case commands.EVAL:
                let { uuid, result } = eventObj.data
                // call the callback of the correct thing(e.g use the uuid) and 
                // give the callback the result
                vsCodeDo.callbacks[uuid](result)
                break;
        }
    }
})

// 
// 
// good-dom
// 
// 

// expand the HTML element ability
Object.defineProperties(window.HTMLElement.prototype, {
    // setting styles through a string
    css : { set: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style').set },
    // allow setting of styles through string or object
    style: {
        set: function (styles) {
            if (typeof styles == "string") {
                this.css = styles
            } else {
                Object.assign(this.style, styles)
            }
        }
    },
    // allow setting of children directly
    children: {
        set: function(newChilden) {
            // remove all children
            while (this.firstChild) {
                this.removeChild(this.firstChild)
            }
            // add new child nodes
            for (let each of newChilden) {
                this.add(each)
            }
        },
        get: function() {
            return this.childNodes
        }
    },
    class: {
        set : function(newClass) {
            this.className = newClass
        },
        get : function() {
            return this.className
        }
    }
})
// add()
window.HTMLElement.prototype.add = function (...inputs) {
    for (let each of inputs) {
        if (typeof each == 'string') {
            this.appendChild(new Text(each))
        } else if (each instanceof Function) {
            this.add(each())
        } else if (each instanceof Array) {
            this.add(...each)
        } else {
            this.appendChild(each)
        }
    }
    return this
}
// the special "add" case of the select method
HTMLSelectElement.prototype.add = window.HTMLElement.prototype.add
// addClass()
window.HTMLElement.prototype.addClass = function (...inputs) {
    return this.classList.add(...inputs)
}
// for (let eachChild of elemCollection)
window.HTMLCollection.prototype[Symbol.iterator] = function* () {
    let index = 0
    let len = this.length
    while (index < len) {
        yield this[index++]
    }
}
// for (let eachChild of elem)
window.HTMLElement.prototype[Symbol.iterator] = function* () {
    let index = 0
    let len = this.childNodes.length
    while (index < len) {
        yield this.childNodes[index++]
    }
}
// create a setter/getter for <head>
let originalHead = document.head
// add a setter to document.head
Object.defineProperty(document,"head", { 
    set: (element) => {
        document.head.add(...element.childNodes)
    },
    get: ()=>originalHead
})

// create a JSX middleware system if it doesnt exist
if (!window.jsxChain) {
    window.jsxChain = []
}

// add it to JSX
window.React = {
    createElement: (name, properties, ...children) => {
        // run middleware
        for (let eachMiddleWare of window.jsxChain) {
            let element = eachMiddleWare(name, properties, ...children)
            if (element) {
                return element
            }
        }
        return Object.assign(document.createElement(name), properties).add(...children)
    },
}

// add all the dom elements
let domElements = {}
tagNames = ["a", "abbr", "acronym", "address", "applet", "area", "article", "aside", "audio", "b", "base", "basefont", "bdi", "bdo", "big", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "data", "datalist", "dd", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "em", "embed", "fieldset", "figcaption", "figure", "font", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hr", "html", "i", "iframe", "img", "input", "ins", "kbd", "label", "legend", "li", "link", "main", "map", "mark", "meta", "meter", "nav", "noframes", "noscript", "object", "ol", "optgroup", "option", "output", "p", "param", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "script", "section", "select", "small", "source", "span", "strike", "strong", "style", "sub", "summary", "sup", "svg", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"]
for (let each of tagNames) {
    eval(`domElements.${each.toUpperCase()} = function(properties,...children) {return Object.assign(document.createElement("${each}"), properties).add(...children)}`)
}
Object.assign(window, domElements)
window.React = React






// 
// 
// build the actual UI
// 
// 