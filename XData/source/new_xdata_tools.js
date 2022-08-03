import * as structure from "./new_structure.js"
import * as utils from "./utils.js" 


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

export const Token = structure.Converter({
    decodesFor: {
        Token: ({string, context})=>{
            // throw ParserError({ message, context }) if parse error

            return new structure.Node({
                childComponents: {},
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
    let newContext = { ...context }
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


export const extractFirst = ({ pattern, from, context }) => {
    const { remaining, extraction } = utils.extractFirst({ pattern, from })
    const node = new Node({
        encoder: "Token",
        childComponents
        formattingPreferences
    })
    return {
        remaining,
        extraction: node,
        context: advancedBy(node, context),
    }
}