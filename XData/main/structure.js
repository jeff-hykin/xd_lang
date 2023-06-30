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
    constructor({toStringifier=null, childComponents={}, formattingPreferences={}}) {
        this.toStringifier = toStringifier
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


export const toNodeifiers = {}
export const isXDataToNodeifier = Symbol("toNodeifiers")
export const RegisterToNodeifier = (things) => {
    // toNodeifiers accept {remaining, context} and return Nodes
    for (const [key, eachFunction] of Object.entries(things||{})) {
        if (eachFunction instanceof Function) {
            eachFunction[isXDataToNodeifier] = true
            toNodeifiers[key] = eachFunction
        }
    }
}

export const toStringifiers = {}
export const isXDataToStringifier = Symbol("toStringifiers")
export const RegisterToStringifier = (things) => {
    // toStringifiers accept {node, context} and return Nodes
    for (const [key, eachFunction] of Object.entries(things||{})) {
        if (eachFunction instanceof Function) {
            eachFunction[isXDataToStringifier] = true
            toStringifiers[key] = eachFunction
        }
    }
}

const converters = {}
export const RegisterConverter = ({toNode, toString}) => {
    RegisterToNodeifier(toNode)
    RegisterToStringifier(toString)
}

/**
 * convert XData string into node tree
 *
 * @example
 *     toNode("10")
 *     toNode({ remaining: "10", context: new Context() })
 * @returns {[Node]} output - list of nodes
 *
 */
export const toNode = (remaining)=>{
    if (typeof remaining != 'string' && remaining instanceof Object) {
        var { remaining, context } = remaining
    }
    context = context || new Context()
    let remainingCharCount = remaining.length
    let prevRemainingCharCount = remainingCharCount
    let nodes = []
    while (remainingCharCount > 0) {
        for (const [name, toNodeifier] of Object.entries(xDataToNode)) {
            try {
                var { remaining, extraction, context } = utils.extract({ pattern: toNodeifier, from: remaining, context })
                nodes.push(nodes)
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
    return nodes
}

export const toString = ({node, context})=> {
    // simply call the correct toStringifier
    return toStringifiers[node.toStringifier]({node, context})
}