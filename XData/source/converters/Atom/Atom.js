import { Token, Node, createConverter, converters, convertComponentToString } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

// context.name
    // checks for: [ "mapKey" ]
    // creates: []

export const Atom = createConverter({
    decoderName: "Atom",
    xdataStringToNode({ string, context }) {
        var remaining = string
        let components = {
            preWhitespace: null, // token
            symbol: null, // token
            content: null, // token
            postWhitespace: null, // token
            comment: null, // node
        }

        // 
        // preWhitespace
        // 
        if (context.name != "mapKey") {
            var { remaining, extraction } = utils.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
            components.preWhitespace = new Token({string:extraction})
        }
        
        // 
        // symbol
        // 
        if (context.name != "mapKey" && remaining.length && remaining[0] != "@") {
            var { remaining, extraction } = utils.extractFirst({ pattern: /@/i, from: remaining }); if (extraction == null) { return null }
            components.symbol = new Token({string:extraction})
        }

        // 
        // content
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /-?[a-zA-Z_][a-zA-Z_0-9]*/, from: remaining }); if (extraction == null) { return null }
        components.content = new Token({string:extraction})
        
        // 
        // postWhitespace
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
        components.postWhitespace = new Token({string:extraction})
        
        // 
        // comment
        // 
        if (context.name != "mapKey") {
            components.comment = converters.Comment.xdataStringToNode({
                string: remaining,
                context: context.advancedBy(
                    (components.preWhitespace||'')+(components.content||'')+(components.postWhitespace||'')
                ),
            })
        }
        
        // 
        // return
        // 
        return new Node({
            decodeAs: "Atom",
            originalContext: context,
            childComponents: components,
            formattingInfo: {},  
        })
    },
    nodeToXdataString({node, contextName}) {
        if (contextName == "mapKey") {
            node.childComponents.preWhitespace = null
            node.childComponents.comment = null
            node.childComponents.symbol = null
        } else {
            node.childComponents.symbol = "@"
        }
        return convertComponentToString({
            component: Object.values(node.childComponents),
            parent:node,
            contextName
        })
    }
})