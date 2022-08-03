import { Token, Node, createConverter, converters, convertComponentToString } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

// context.name
    // checks for: []
    // creates: []

export const Anonymous = createConverter({
    decoderName: "Anonymous",
    // never parses anything (so always returns null)
    xdataStringToNode({ string, context }) {
        return null
    },
    // just lets things use the default decoder
    nodeToXdataString({node, contextName}) {
        return convertComponentToString({
            component: Object.values(node.childComponents),
            parent:node,
            contextName
        })
    }
})