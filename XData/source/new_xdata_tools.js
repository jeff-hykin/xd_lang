import * as structure from "./new_structure.js"
import * as utils from "./utils.js" 
import { capitalize, indent, toCamelCase, toPascalCase, toKebabCase, toSnakeCase, toScreamingtoKebabCase, toScreamingtoSnakeCase, toRepresentation, toString } from "https://deno.land/x/good@0.5.15/string.js"

const options = {
    debuggingSnippetAmount: 100, // characters
}

export function defaultToString({node, parentNode, context}) {
    // base case 1
    if (node == null) {
        return ""
    // base case 2
    } else if (typeof node == 'string') {
        return node
    } else if (node instanceof Array) {
        return node.map(each=>defaultToString({node: each, context, parentNode: node})).join("")
    // recursive case 2 // if it is a proper node
    } else if (node instanceof Object) {
        if (node.encoder && structure.encoders[node.encoder]) {
            const encoder = structure.encoders[node.encoder]
            return encoder({ node, context })
        }
    }

    throw Error(`I don't know how to convert \n${utils.toString(node)}\nof\n${utils.toString(parentNode)}\n into an XData string. It doesnt have a .encode property that is in the available encoders:\n${utils.toString(Object.keys(structure.encoders))}`)
}

export function childComponentsToString({node, context}) {
    let string = ""
    for (const [key, value] of Object.entries(node.childComponents)) {
        string += defaultToString(value)
    }
    return string
}

// 
// Token
// 
structure.Converter({
    decoders: {
        Token: ({string, context})=>{
            // throw ParserError({ message, context }) if parse error
            return new structure.Node({
                encoder: "Token",
                childComponents: string,
                formattingPreferences: {},
            })
        }
    },
    encoders: {
        Token: ({node, context})=>{
            if (node.childComponents == null) {
                return ``
            } else {
                return `${node.childComponents}`
            }
        }
    }
})

const advancedBy = (stringOrNode, context) => {
    let newContext = {
        ...context,
        adjectives: {
            ...context.adjectives
        },
        debugInfo: {
            stringIndex: 0,
            lineIndex: 0,
            columnIndex: 0,
            ...context.debugInfo
        },
    }
    if (stringOrNode == null) {
        return newContext
    } else  if (stringOrNode instanceof Array) {
        for (let eachInput of stringOrNode) {
            newContext = advancedBy(eachInput, newContext)
        }
    } else if (typeof stringOrNode == 'string') {
        const string = stringOrNode
        const lines = string.split("\n")
        // TODO: write a unit test to confirm context actually works
        newContext.debugInfo.stringIndex = context.debugInfo.stringIndex + string.length
        newContext.debugInfo.lineIndex   = context.debugInfo.lineIndex + lines.length - 1
        newContext.debugInfo.columnIndex = lines.slice(-1)[0].length
    } else if (stringOrNode instanceof Node) {
        for (const [key, subComponent] of Object.entries(node.childComponents)) {
            newContext = advancedBy(subComponent, newContext)
        }
    }
    return newContext
}

export const extract = ({ pattern, oneOf, from, context }) => {
    // 
    // simple string or regex
    // 
    if (pattern instanceof RegExp || typeof pattern == 'string') {
        
        const { remaining, extraction } = utils.extractFirst({ pattern, from })
        const node = new Node({
            encoder: "Token",
            childComponents,
            formattingPreferences,
        })
        return {
            remaining,
            extraction: node,
            context: advancedBy(node, context),
        }
    } else if (pattern instanceof Object) {
        if (pattern[structure.isDecoder]) {
            const decoder = pattern[structure.isDecoder]
            const node = decoder({ string: from, context })
            const newContext = advancedBy(node, context)
            const numberOfCharactersAdvanced = newContext.debugInfo.stringIndex - (context.debugInfo.stringIndex||0)
            const remaining = from.slice(numberOfCharactersAdvanced)
            return {
                remaining,
                extraction: node,
                context: newContext,
            }
        }
        throw Error(`There was a problem when calling:\n    extract({ pattern, from, context })\nThe pattern was an object, but not an encoder/decoder. Instead it was:\n    ${toRepresentation(pattern)} `)
    } else if (oneOf instanceof Array) {
        // just try all of them
        for (const each of oneOf) {
            try {
                return extract({ pattern: each, from, context })
            } catch (error) {
                // only catch parse errors
                if (!(error instanceof structure.ParserError)) {
                    throw error
                }
            }
        }
        
        throw structure.ParserError(`Had a string starting with:\n    ${toRepresentation(from.slice(0, options.debuggingSnippetAmount))}\nI tried to match one of the following but failed:\n${oneOf.map(each=>indent(toRepresentation(each))+'\n')}`)
    }
}