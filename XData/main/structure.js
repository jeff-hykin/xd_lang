import * as utils from "./utils.js"



// 
// 
// errors
// 
// 

export class ParserError extends Error {
    constructor({ message, context }) {
        super(message)
        this.context = context
    }
}

export class CantDecodeContext extends ParserError {
    constructor({ message, context }) {
        super(message)
        this.context = context
    }
}


// 
// 
// basic structures
// 
// 
export class Node {
    constructor({decoder=null, childComponents={}, formattingPreferences={}}) {
        this.decoder = decoder
        this.childComponents = childComponents
        this.formattingPreferences = formattingPreferences
    }
}

// this is basically registry
export class ContextIds {
    static root = Symbol("rootContext")
    static mapKey = Symbol("mapKeyContext")
    static inlineValue = Symbol("inlineValueContext")
    static block = Symbol("blockContext")
    static referencePath = Symbol("referencePathContext")
}

export class Context {
    constructor(debugInfo={}, parentContext=null, id=ContextIds.root) {
        this.debugInfo     = debugInfo
        this.parentContext = parentContext
        this.id            = id
        Object.freeze(this)
    }
}


const decoders = {}
export const isDecoder = Symbol("decoder")
export const Decoders = (decodersObject) => {
    // decoders accept {remaining, context} and return Nodes
    for (const [key, eachFunction] of Object.entries(decodersObject||{})) {
        if (eachFunction instanceof Function) {
            eachFunction[isDecoder] = true
            decoders[key] = eachFunction
        }
    }
}

const encoders = {}
export const isEncoder = Symbol("encoder")
export const Encoders = (encodersObject) => {
    // encoders accept {node, context} and return Nodes
    for (const [key, eachFunction] of Object.entries(encodersObject||{})) {
        if (eachFunction instanceof Function) {
            eachFunction[isEncoder] = true
            encoders[key] = eachFunction
        }
    }
}

const converters = {}
export const Converter = ({encoders, decoders}) => {
    return [
        Encoders(decoders),
        Decoders(encoders),
    ]
}

export const decode = (remaining)=>{
    var context = new Context()
    let remainingCharCount = remaining.length
    let prevRemainingCharCount = remainingCharCount
    let nodes = []
    while (remainingCharCount) {
        for (const [name, decoder] of Object.entries(decoders)) {
            try {
                var { remaining, extraction, context } = utils.extract({ oneOf: Object.values(decoders), from: remaining, context })
            } catch (error) {
                if (error instanceof ParserError) {
                    // ignore
                } else {
                    throw error
                }
            }
            remainingCharCount = remaining.length
            // break as soon as something was extracted
            if (extraction && remainingCharCount < prevRemainingCharCount) {
                break
            }
        }
        
        // make sure at least one match had a non-0 extraction
        remainingCharCount = remaining.length
        if (remainingCharCount == prevRemainingCharCount) {
            throw Error(`Got stuck trying to parse this remaining string: \n${remaining}`)
        }
        prevRemainingCharCount = remaining.length
    }
}