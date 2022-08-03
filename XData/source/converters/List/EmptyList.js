import { Token, Node, createConverter, converters, convertComponentToString } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

// context.name
    // checks for: []
    // creates: []

export const EmptyList = createConverter({
    decoderName: "EmptyList",
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
        // preWhitespace
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
        components.preWhitespace = new Token({string:extraction})
        
        // 
        // openingBracket
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /\[/, from: remaining }); if (extraction == null) { return null }
        components.openingBracket = new Token({string:extraction})
        
        // 
        // preWhitespace
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
        components.whitespace = new Token({string:extraction})

        
        // 
        // openingBracket
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /\]/, from: remaining }); if (extraction == null) { return null }
        components.closingBracket = new Token({string:extraction})
        
        // 
        // postWhitespace
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
        components.postWhitespace = new Token({string:extraction})
        
        // 
        // comment
        // 
        components.comment = converters.Comment.xdataStringToNode({
            string: remaining,
            context: context.advancedBy(
                (components.preWhitespace||'')+(components.openingBracket||'')+(components.whitespace||'')+(components.closingBracket||'')+(components.postWhitespace||'')
            ),
        })
        
        // 
        // return
        // 
        return new Node({
            decodeAs: "EmptyList",
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