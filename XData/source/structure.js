const utils = require("./utils")

class StringLocation {
    lineIndex = 0
    characterIndex = 0
    stringIndex = 0
    constructor({stringIndex=0, lineIndex=0, characterIndex=0}) {
        this.lineIndex = lineIndex
        this.characterIndex = characterIndex
        this.stringIndex = stringIndex
    }
}
module.exports.StringLocation = StringLocation

// 
// 
// contents
// 
// 
const Component = module.exports.Component = class {}
const Token = module.exports.Token = class extends Component {
    string = null
    constructor({string}) {
        this.string = string
    }
    getEndLocation(startLocation=(new StringLocation())) {
        const string = this.string
        if (string != null && startLocation != null) {
            const lines = string.split("\n")
            return new StringLocation({
                stringIndex: startLocation.stringIndex + string.length,
                lineIndex: startLocation.lineIndex + lines.length - 1,
                characterIndex: lines[0].length,
            })
        } else {
            return startLocation
        }
    }
}

const Node = module.exports.Node = class extends Component {
    converterName = ""
    form = null
    startLocation = null
    endLocation = null
    components = {}
    options = {}
    constructor({components, options}) {
        this.components = components
        this.options = options
    }
    getEndLocation(startLocation=(new StringLocation())) {
        let runningEndLocation = startLocation
        for (const [key, each] of Object.entries(this.components)) {
            runningEndLocation = each.getEndLocation(runningEndLocation)
        }
        return runningEndLocation
    }
    // TODO: add a getComments() that recursively calls getComments() on components
}

// 
// 
// errors
// 
// 
const ProbablyMalformedInput = module.exports.ProbablyMalformedInput = class extends Error {
    constructor({ stringLocation, converterName, message }) {
        super(message)
        this.stringLocation = stringLocation
        this.converterName = converterName
    }
}

// 
// 
// converters
// 
// 
const Converters = module.exports.Converters = class {
    validForms = [ "topLevel", "key", "referenceEvaulation", "restOfLineValue", "spanningLinesValue", "indentedValue" ]
    // be able to look up any node  
    static converterRegistry = {}
    constructor() {
        Converters.converterRegistry[this.converterName] = this
    }

    get converterName() {
        return this.constructor.name
    }

    // create an jsonifyable object from a string value
    toNode({ fullString, stringLocation, form, }) {
        const remainingString = fullString.slice(stringLocation.stringIndex, fullString.length)
        let result = {}
        const output = {
            inputIsProbablyMalformed: null,
            node: null,
            stringLocation,
        }
        try {
            output.node = coreToNode({remainingString, form})
            if (output.node instanceof Node) {
                output.stringLocation = output.node.getEndLocation(stringLocation)
            }
        } catch (error) {
            // no big deal, dont report
            if (error instanceof ProbablyMalformedInput) {
                output.inputIsProbablyMalformed = error
            // okay probably something in the code is wrong, report that
            } else {
                throw error
            }
        }
        return output
    }

    // 
    // children should implement the following
    // 

    coreToNode({remainingString, form}) {
        // children should implment this
        throw ProbablyMalformedInput({ stringLocation, converterName, message })
        return node || null
    }

    fixUpNode({ nodeWithModifications, originalNode }) {
        // return jsonifyable object that can be converted into a valid Xdata string
        return nodeWithModifications
    }
    
    // default version is basically recursive concat
    nodeToXdataString(node) {
        const fixedNode = this.fixUpNode(node)
        let outputString = ""
        for (const [key, value] of Object.entries(fixedNode.components)) {
            // if nullish then skip
            if (value == null) {
                // skip
            } else if (value instanceof Object) {
                // if it is a node
                if (value.converterName) {
                    const converter = Converters.converterRegistry[value.converterName]
                    outputString += converter.nodeToXdataString(value)
                // if its is a token
                } else {
                    outputString += value.string
                }
            // something else, thats an error
            } else {
                throw Error(`nodeToXdataString() one of the components wasnt an object: ${value}`)
            }
        }
        return outputString
    }
}