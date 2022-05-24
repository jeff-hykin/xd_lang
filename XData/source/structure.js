import * as utils from "./utils.js"



// 
// 
// errors
// 
// 

export const ProbablyMalformedInput = class extends Error {
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
export const Location = class {
    lineIndex = 0
    characterIndex = 0
    stringIndex = 0
    constructor({stringIndex=0, lineIndex=0, characterIndex=0}) {
        this.lineIndex
        this.characterIndex
        this.stringIndex
    }
}
export const Context = class extends Location {
    static validNames = [ "topLevel", "key", "referenceEvaulation", "restOfLineValue", "spanningLinesValue", "indentedValue" ]
    name = ""
    lineIndex = 0
    characterIndex = 0
    stringIndex = 0
    constructor({name, stringIndex=0, lineIndex=0, characterIndex=0}) {
        this.name
        this.lineIndex
        this.characterIndex
        this.stringIndex
        if (!this.validNames.includes(this.name)) {
            throw Error(`Context was created with name: ${name}, but that isn't one of ${this.validNames}`)
        }
    }
}

// 
// 
// contents
// 
// 
export let converters = {}
export const Component = class {}
// token is basically a helper class for strings, just adding extra methods to what would be a primitive
export const Token = class extends Component {
    string = null
    context = null
    constructor({string, context}) {
        this.string
        this.context
    }
    getEndLocation(startLocation=(new Location())) {
        const string = this.string
        if (string != null && startLocation != null) {
            const line = string.split("\n")
            return new Location({
                stringIndex: startLocation.stringIndex + string.length,
                lineIndex: startLocation.lineIndex + lines.length - 1,
                characterIndex: lines[0].length,
            })
        } else {
            return startLocation
        }
    }
}
// node is the main guy
export const Node = class extends Component {
    decodeAs = ""
    childComponents = {} // the order of the items in this object is significant
    formattingInfo = {}
    context = null
    constructor({decodeAs, childComponents, formattingInfo, context}) {
        this.decodeAs = decodeAs
        this.childComponents = childComponents
        this.formattingInfo = formattingInfo
        this.context = context
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
            childComponents: this.childComponents,
            formattingInfo: this.formattingInfo,
            context: this.context,
        }
    }
    toXDataString() {
        return converters.registry[this.decodeAs].nodeToXdataString(this)
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
}) {
    converters[decoderName] = {
        // default values
        nodeToXdataString(node) {
            let outputString = ""
            for (const [key, value] of Object.entries(fixedNode.childComponents)) {
                // if it is a node
                if (value.decodeAs) {
                    const converter = Converters.registry[value.decodeAs]
                    outputString += converter.nodeToXdataString(value)
                }
            }
            return outputString
        },
        ...({...xdataStringToNode}),
        ...({...nodeToXdataString}),
    }
}