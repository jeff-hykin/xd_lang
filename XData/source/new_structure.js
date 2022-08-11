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

export class Context {
    constructor(adjectives={}, debugInfo={}, parentContext=null) {
        this.adjectives    = adjectives
        this.debugInfo     = debugInfo
        this.parentContext = parentContext
        Object.freeze(this)
    }
}


const decoders = {}
export const isDecoder = Symbol("decoder")
export const Decoders = (decodersObject) => {
    // decoders accept {string, context} and return Nodes
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
    // encoders accept {string, context} and return Nodes
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