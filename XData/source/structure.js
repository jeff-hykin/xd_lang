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
const advancedBy = (stringOrNode, object) => {
    let newValue = { ...object }
    if (stringOrNode == null) {
        return object
    } else  if (stringOrNode instanceof Array) {
        let eachLocation = object
        for (let eachInput of stringOrNode) {
            eachLocation = eachLocation.advancedBy(eachInput)
        }
        return eachLocation
    } else if (typeof stringOrNode == 'string') {
        const string = stringOrNode
        const lines = string.split("\n")
        // TODO: write a unit test to confirm object actually works
        newValue.stringIndex = object.stringIndex + string.length
        newValue.lineIndex = object.lineIndex + lines.length - 1
        newValue.columnIndex = lines[0].length
    } else if (stringOrNode instanceof Node) {
        const node = stringOrNode
        Object.assign(newValue, node.getEndLocation(object))
    }
    return newValue
}
export class Location {
    lineIndex = 0
    columnIndex = 0
    stringIndex = 0
    constructor({stringIndex=0, lineIndex=0, columnIndex=0}) {
        this.lineIndex = stringIndex
        this.columnIndex = lineIndex
        this.stringIndex = columnIndex
        Object.freeze(this)
    }
    advancedBy(stringOrNode) {
        return new Location(advancedBy(stringOrNode, this))
    }
}
export class Context {
    name = ""
    lineIndex = 0
    columnIndex = 0
    stringIndex = 0
    constructor({name, stringIndex=0, lineIndex=0, columnIndex=0}) {
        this.name = name
        this.lineIndex = lineIndex
        this.columnIndex = columnIndex
        this.stringIndex = stringIndex
        if (!contextNames.has(this.name)) {
            throw Error(`Context was created with name: ${name}, but that isn't one of ${[...contextNames]}`)
        }
        Object.freeze(this)
    }
    advancedBy(input) {
        return new Context({
            ...advancedBy(stringOrNode, this),
            name: this.name,
        })
    }
}

// 
// 
// contents
// 
// 
export const converters = {}
export const contextNames = new Set()
export class Component {}
// token is basically a helper class for strings, just adding extra methods to what would be a primitive
export class Token extends Component {
    string = null
    originalContext = null
    constructor({string, originalContext}) {
        super()
        this.string = string
        this.originalContext = originalContext
    }
    toJson() {
        return this.string
    }
    getEndLocation(startLocation=(new Location())) {
        // TODO: arguably should use this.originalContext as starting location
        if (startLocation instanceof Location) {
            return startLocation.advancedBy(this.string)
        }
    }
}
// node is the main guy
export class Node extends Component {
    decodeAs = ""
    childComponents = {} // the order of the items in this object is significant
    formattingInfo = {}
    originalContext = null
    constructor({decodeAs, childComponents, formattingInfo={}, originalContext}) {
        super()
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
    stringAndContextResult({ remainingString, context }) {
        const editableContext = {...context}
        const start = context.stringIndex
        const endLocation = this.getEndLocation(context)
        const end = endLocation.stringIndex
        const numberOfCharacters = end - start
        Object.assign(editableContext, endLocation)
        return {
            remainingString: remainingString.slice(0, numberOfCharacters),
            context: new Context(editableContext)
        }
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

export function convertComponentToString({component, parent, contextName}) {
    // base case 1
    if (typeof component == 'string') {
        return component
    // base case 2
    } else if (component instanceof Token) {
        return component.string
    // base case 3
    } else if (component == null) {
        return ""
    // recursive case 1
    } else if (component instanceof Array) {
        return component.map(each=>convertComponentToString({component: each, contextName, parent})).join("")
    // recursive case 2 // if it is a proper node
    } else if (converters[component.decodeAs]) {
        const converter = converters[component.decodeAs]
        return converter.nodeToXdataString({component, contextName})
    } else {
        throw Error(`I don't know how to convert \n${utils.toString(component)}\nof\n${utils.toString(parent)}\n into an XData string. It doesnt have a .decodeAs property that is in the available decoders:\n${utils.toString(Object.keys(converters))}`)
    }
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
    contextNames=[],
    nodeToXdataString=null,
    ...other
}) {
    for (const each of contextNames) {
        contextNames.add(each)
    }
    
    // 
    // nodeToXdataString: wrap or default 
    // 
    if (nodeToXdataString) {
        const originalFunction = nodeToXdataString
        nodeToXdataString = ({ node, contextName })=>{
            // convert plain objects (e.g. from json) to have helper methods
            node = new Node(node)
            return originalFunction({ node, contextName })
        }
    } else {
        nodeToXdataString = function({node, contextName}) {
            let outputString = ""
            for (const [key, component] of Object.entries(node.childComponents)) {
                outputString += convertComponentToString({component, parent: node, contextName})
            }
            return outputString
        }
    }

    converters[decoderName] = {
        xdataStringToParsed({ remaining, context }) {
            const node = xdataStringToNode({ string: remaining, context })
            if (!node) {
                return { node, remaining, context }
            } else {
                var { remainingString: remaining, context } = node.stringAndContextResult({
                    remainingString: remaining,
                    context,
                })
                return {
                    node,
                    remaining,
                    context,
                }
            }
        },
        nodeToXdataString,
        xdataStringToNode,
        ...other,
    }
    return converters[decoderName]
}