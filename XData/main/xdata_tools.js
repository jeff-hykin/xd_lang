import * as structure from "./structure.js"
import * as utils from "./utils.js" 
import { capitalize, indent, toCamelCase, toPascalCase, toKebabCase, toSnakeCase, toScreamingtoKebabCase, toScreamingtoSnakeCase, toRepresentation, toString } from "https://deno.land/x/good@1.3.0.4/string.js"

const options = {
    debuggingSnippetAmount: 100, // characters
}

// 
// Token
// 
structure.RegisterConverter({
    toNode: {
        Token: ({remaining, context})=>{
            // throw ParserError({ message, context }) if parse error
            return new structure.Node({
                toStringifier: "Token",
                childComponents: remaining,
                formattingPreferences: {},
            })
        }
    },
    toString: {
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
    } else if (stringOrNode instanceof structure.Node) {
        for (const [key, subComponent] of Object.entries(stringOrNode.childComponents)) {
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
        const node = new structure.Node({
            toStringifier: "Token",
            childComponents: extraction,
            formattingPreferences: {},
        })
        return {
            remaining,
            extraction: node,
            context: advancedBy(node, context),
        }
    } else if (pattern instanceof Object) {
        if (pattern[structure.isNodeifier]) {
            const nodeifier = pattern[structure.isNodeifier]
            const node = nodeifier({ remaining: from, context })
            const newContext = advancedBy(node, context)
            const numberOfCharactersAdvanced = newContext.debugInfo.stringIndex - (context.debugInfo.stringIndex||0)
            const remaining = from.slice(numberOfCharactersAdvanced)
            return {
                remaining,
                extraction: node,
                context: newContext,
            }
        }
        throw Error(`There was a problem when calling:\n    extract({ pattern, from, context })\nThe pattern was an object, but not a converter. Instead it was:\n    ${toRepresentation(pattern)} `)
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
        
        throw new structure.ParserError({ message: `Had a string starting with:\n    ${toRepresentation(from.slice(0, options.debuggingSnippetAmount))}\nI tried to match one of the following but failed:\n${oneOf.map(each=>indent(toRepresentation(each))+'\n')}`, context })
    } else {
        throw Error(`Unrecognized arguments for extract() ${toRepresentation({pattern, oneOf, from, context})}`)
    }
}