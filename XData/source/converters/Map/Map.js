import { Token, Node, createConverter, converters, convertComponentToString } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

// context.name
    // checks for: ["inline"]
    // creates: []

export const Map = createConverter({
    decoderName: "Map",
    xdataStringToNode({ string, context }) {
        var remaining = string
        let components = {
            preWhitespace: null, // token
            openingBracket: null, // token
            whitespace: null, // token
            closingBracket: null, // token
            postWhitespace: null, // token
            comment: null, // node
        }
        
        // 
        // the only valid inline map is an empty map
        // 
        if (context.name == "inline") {
            return converters.EmptyMap.xdataStringToNode({
                string,
                context,
            })
        }

        // FIXME: not yet defined for non-inline values
        
        // 
        // return
        // 
        return new Node({
            decodeAs: "Map",
            originalContext: context,
            childComponents: components,
            formattingInfo: {},  
        })
    },
    nodeToXdataString({node, contextName}) {
        return convertComponentToString({
            component: Object.values(node.childComponents),
            parent:node,
            contextName
        })
    }
})