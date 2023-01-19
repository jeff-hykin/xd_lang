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
    constructor({encoder=null, childComponents={}, formattingPreferences={}}) {
        this.encoder = encoder
        this.childComponents = childComponents
        this.formattingPreferences = formattingPreferences
    }
}

// this is basically registry
export class ContextId {
    constructor(name) {
        this.name = name
        ContextId[name] = this
    }
}
const rootContextId = new ContextId("root")

export class Context {
    constructor(adjectives={}, debugInfo={}, parentContext=null, id=rootContextId) {
        this.adjectives    = adjectives
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
    for (const [key, eachFunction] of Object.entries(decodersObject)) {
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
    for (const [key, eachFunction] of Object.entries(encodersObject)) {
        if (eachFunction instanceof Function) {
            eachFunction[isEncoder] = true
            encoders[key] = eachFunction
        }
    }
}

const converters = {}
export const Converter = ({decoders, encoders}) => {
    return [
        Encoders(encoders),
        Decoders(decoders),
    ]
}

export const decode = (remaining)=>{
    const context = new Context()
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