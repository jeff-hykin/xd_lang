import { Token, Node, createConverter, converters, convertComponentToString } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

// context.name
    // checks for: ["inline"]
    // creates: []

export const List = createConverter({
    decoderName: "List",
    xdataStringToNode({ string, context }) {
        var remaining = string
        let components = {
            preWhitespace: null, // token
            openBracket: null, // token
            whitespace: null, // token
            closeBracket: null, // token
            postWhitespace: null, // token
            comment: null, // node
        }
        
        // 
        // the only valid inline List is an empty List
        // 
        if (context.name == "inline") {
            return converters.EmptyList.xdataStringToNode({
                string,
                context,
            })
        }

        // FIXME: not yet defined for non-inline values
        
        // 
        // return
        // 
        return new Node({
            decodeAs: "List",
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