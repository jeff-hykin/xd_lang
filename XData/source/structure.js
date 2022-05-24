import * as utils from "./utils.js"



// 
// 
// errors
// 
// 

export class ProbablyMalformedInput extends Error {
    constructor({ location, decodeAs, message }) {
        super(message)
        this.location
        this.decodeAs
    }
}


// 
// 
// basic structures
// 
// 
export class Location {
    lineIndex = 0
    columnIndex = 0
    stringIndex = 0
    constructor({stringIndex=0, lineIndex=0, columnIndex=0}) {
        this.lineIndex
        this.columnIndex
        this.stringIndex
    }
    duplicate() {
        return new Location(this)
    }
    advanceBy(stringOrNode) {
        if (typeof stringOrNode == 'string') {
            const string = stringOrNode
            const lines = string.split("\n")
            // TODO: write a unit test to confirm this actually works
            this.stringIndex = this.stringIndex + string.length,
            this.lineIndex = this.lineIndex + lines.length - 1,
            this.columnIndex = lines[0].length,
        } else if (stringOrNode instanceof Node) {
            const node = stringOrNode
            Object.assign(this, node.getEndLocation(this))
        }
        return this
    }
}
export class Context extends Location {
    static validNames = [ "topLevel", "key", "referenceEvaulation", "restOfLineValue", "spanningLinesValue", "indentedValue" ]
    name = ""
    lineIndex = 0
    columnIndex = 0
    stringIndex = 0
    constructor({name, stringIndex=0, lineIndex=0, columnIndex=0}) {
        this.name
        this.lineIndex
        this.columnIndex
        this.stringIndex
        if (!this.validNames.includes(this.name)) {
            throw Error(`Context was created with name: ${name}, but that isn't one of ${this.validNames}`)
        }
    }
    duplicate() {
        return new Context(this)
    }
}

// 
// 
// contents
// 
// 
export let converters = {}
export class Component {}
// token is basically a helper class for strings, just adding extra methods to what would be a primitive
export class Token extends Component {
    string = null
    originalContext = null
    constructor({string, originalContext}) {
        this.string
        this.originalContext
    }
    toJson() {
        return this.string
    }
    getEndLocation(startLocation=(new Location())) {
        // TODO: arguably should use this.originalContext as starting location
        if (startLocation == null) {
            return null
        }
        startLocation = startLocation.duplicate()
        startLocation.advanceBy(this.string)
        return startLocation
    }
}
// node is the main guy
export class Node extends Component {
    decodeAs = ""
    childComponents = {} // the order of the items in this object is significant
    formattingInfo = {}
    originalContext = null
    constructor({decodeAs, childComponents, formattingInfo, originalContext}) {
        this.decodeAs = decodeAs
        this.childComponents = childComponents
        this.formattingInfo = formattingInfo
        this.originalContext = originalContext
        // make sure all childComponents inherit from Component
        for (const [key, value] of Object.entries(childComponents)) {
            if (typeof value == 'string') {
                this.childComponents[key] = new Token({ string, originalContext: null })
            }
        }
    }
    getEndLocation(startLocation=(new Location())) {
        let runningEndLocation = startLocation
        for (const [key, each] of Object.entries(this.childComponents)) {
            runningEndLocation = each.getEndLocation(runningEndLocation)
        }
        return runningEndLocation
    }
    toJson() {
        return {
            decodeAs: this.decodeAs,
            childComponents: this.childComponents.map(each=>each.toJson()),
            formattingInfo: this.formattingInfo,
            originalContext: this.originalContext,
        }
    }
    // TODO: add a getComments() that recursively calls getComments() on childComponents
}

/**
 * Function
 *
 * @param {String} args.decoderName - a
 * @param {Function} args.xdataStringToNode - ({ string, context }) => Node
 * @param {Function} args.nodeToXdataString - (node) => String
 *
 */
export const createConverter = function ({
    decoderName,
    xdataStringToNode,
    nodeToXdataString=null,
    ...other,
}) {
    converters[decoderName] = {
        // default values
        nodeToXdataString(node) {
            function convertComponent(component, node) {
                // base case 1
                if (typeof component == 'string') {
                    return component
                // base case 2
                } else if (component instanceof Token) {
                    return component.string
                // recursive case 1
                } else if (component instanceof Array) {
                    return component.map(each=>convertComponent(each)).join("")
                // recursive case 2 // if it is a proper node
                } else if (converters[component.decodeAs]) {
                    const converter = converters[component.decodeAs]
                    return converter.nodeToXdataString(component)
                } else {
                    throw Error(`I don't know how to convert \n${utils.toString(component)}\nof\n${utils.toString(node)}\n into an XData string. It doesnt have a .decodeAs property that is in the available decoders:\n${utils.toString(Object.keys(converters))}`)
                }
            }
            let outputString = ""
            for (const [key, component] of Object.entries(node.childComponents)) {
                outputString += convertComponent(component)
            }
            return outputString
        },
        ...({nodeToXdataString}), // override the one above if non-null
        xdataStringToNode,
        ...other,
    }
    return converters[decoderName]
}