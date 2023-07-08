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
                childComponents: {
                    content: remaining,
                },
                formattingPreferences: {},
            })
        }
    },
    toString: {
        Token: ({node, context})=>{
            if (node.childComponents == null) {
                return ``
            } else {
                return `${node.childComponents.content}`
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

/**
 * pull text out
 *
 * @example
 *     var { remaining, extraction, context } = tools.extract({
 *         pattern: /^[ \n]+/,
 *         from: remaining,
 *         context
 *     })
 *
 * @returns {String} output.remaining 
 * @returns {Node|String|Array} output.extraction 
 * @returns {Context} output.context
 *
 */
export const extract = ({ pattern, oneOf, repeat=false, from, context }) => {
    // call self until failure
    if (repeat) {
        var remaining = from
        var extractions = []
        while (1) {
            try {
                const remainingBefore = remaining
                var { remaining, extraction, context } = extract({ pattern, oneOf, from: remaining, context })
                // 0-length extraction
                if (remainingBefore == remaining) {
                    break
                }
                extractions.push(extraction)
            } catch (error) {
                break
            }
        }
        return { remaining, extraction: extractions, context }
    }

    // 
    // simple string or regex
    // 
    if (pattern instanceof RegExp || typeof pattern == 'string') {
        const { remaining, extraction } = utils.extractFirst({ pattern, from })
        if (extraction == null) {
            throw new structure.ParserError({message: `Unable to extract: ${pattern} from ${from}`, context})
        }
        const node = new structure.Node({
            toStringifier: "Token",
            childComponents: {
                content: extraction
            },
            formattingPreferences: {},
        })
        return {
            remaining,
            extraction: extraction,
            context: advancedBy(node, context),
        }
    } else if (pattern instanceof Function) {
        const node = pattern({ remaining: from, context })
        const newContext = advancedBy(node, context)
        const numberOfCharactersAdvanced = newContext.debugInfo.stringIndex - (context.debugInfo.stringIndex||0)
        const remaining = from.slice(numberOfCharactersAdvanced)
        return {
            remaining,
            extraction: node,
            context: newContext,
        }
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