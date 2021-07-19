const utils = require("./utils")



// 
// 
// errors
// 
// 

const ProbablyMalformedInput = module.exports.ProbablyMalformedInput = class extends Error {
    constructor({ location, decodeAs, message }) {
        super(message)
        this.location = location
        this.decodeAs = decodeAs
    }
}


// 
// 
// basic structures
// 
// 
const Location = module.exports.Location = class {
    lineIndex = 0
    characterIndex = 0
    stringIndex = 0
    constructor({stringIndex=0, lineIndex=0, characterIndex=0}) {
        this.lineIndex = lineIndex
        this.characterIndex = characterIndex
        this.stringIndex = stringIndex
    }
}
const Context = module.exports.Context = class extends Location {
    static validNames = [ "topLevel", "key", "referenceEvaulation", "restOfLineValue", "spanningLinesValue", "indentedValue" ]
    name = ""
    lineIndex = 0
    characterIndex = 0
    stringIndex = 0
    constructor({name, stringIndex=0, lineIndex=0, characterIndex=0}) {
        this.name = name
        this.lineIndex = lineIndex
        this.characterIndex = characterIndex
        this.stringIndex = stringIndex
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
let converters = module.exports.converters = {}
const Component = module.exports.Component = class {}
// token is basically a helper class for strings, just adding extra methods to what would be a primitive
const Token = module.exports.Token = class extends Component {
    string = null
    context = null
    constructor({string, context}) {
        this.string = string
        this.context = context
    }
    getEndLocation(startLocation=(new Location())) {
        const string = this.string
        if (string != null && startLocation != null) {
            const lines = string.split("\n")
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
const Node = module.exports.Node = class extends Component {
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

// 
// 
// converters
// 
// 


/**
 * Function that does something
 *
 * @param {String} args.decoderName - a
 * @param {Function} args.xdataStringToNode - ({ string, context }) => Node
 * @param {Function} args.nodeToXdataString - (node) => String
 *
 */
const createConverter = module.exports.createConverter = function ({
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