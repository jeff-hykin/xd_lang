import { Token, Node, createConverter, converters, convertComponentToString } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

// context.name
    // checks for: [ "mapKey" ]
    // creates: []
                                        
export const Number = createConverter({
    decoderName: "Number",
    xdataStringToNode({ string, context }) {
        var remaining = string
        let components = {
            preWhitespace: null, // token
            sign: null, // token
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
        // sign
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /(-|\+)?/, from: remaining }); if (extraction == null) { return null }
        components.sign = new Token({string:extraction})

        // 
        // content
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /\d+(\.\d+)?/, from: remaining }); if (extraction == null) { return null }
        components.content = new Token({string:extraction})
        
        // 
        // postWhitespace
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
        components.postWhitespace = new Token({string:extraction})
        
        if (context.name != "mapKey") {
            // 
            // comment
            // 
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
            decodeAs: "Number",
            originalContext: context,
            childComponents: components,
            formattingInfo: {},  
        })
    },
    nodeToXdataString({node, contextName}) {
        if (contextName == "mapKey") {
            node.childComponents.preWhitespace = null
            node.childComponents.comment = null
        }
        return convertComponentToString({
            component: Object.values(node.childComponents),
            parent:node,
            contextName
        })
    }
})