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
        super()
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


const decoders = []
export const isDecoder = Symbol("decoder")
export const Decoder = ({decodesFor}) => {
    // decoders accept {string, context} and return Nodes
    for (const [key, eachFunction] of Object.entries(decodesFor)) {
        const coder = (...args)=>new Node({
            ...eachFunction(...args),
            encoder: key,
        })
        coder[isDecoder] = true
        decoders.push(coder)
    }
}

const encoders = {}
export const isEncoder = Symbol("encoder")
export const Encoder = ({name, encode}) => {
    // encoders accept {node, context} and return a formatted string
    encoders[name] = encode
    encode[isEncoder] = true
}

const converters = {}
export const Converter = ({decodesFor, encoders}) => {
    // create the encoders
    for (const [key, value] of Object.entries(encoders)) {
        Encoder(key, value)
    }
    // create the encoder(s)
    Decoder({encodesFor})
}