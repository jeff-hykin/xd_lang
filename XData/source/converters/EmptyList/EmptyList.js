import { Token, Node, createConverter, converters, convertComponent } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

export const EmptyList = createConverter({
    decoderName: "EmptyList",
    contextNames: [ "key" ],
    xdataStringToNode({ string, context }) {
        var remaining = string
        // doesnt care about the context.name: "topLevel", "key", "referenceEvaulation", "restOfLineValue", "spanningLinesValue", "indentedValue"
        let components = {
            preWhitespace: null, // token
            openBracket: null, // token
            whitespace: null, // token
            closeBracket: null, // token
            postWhitespace: null, // token
            comment: null, // node
        }

        // 
        // preWhitespace
        // 
        if (context.name != "key") {
            var { remaining, extraction } = utils.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
            components.preWhitespace = new Token({string:extraction})
        }
        
        // 
        // openBracket
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /\[/, from: remaining }); if (extraction == null) { return null }
        components.openBracket = new Token({string:extraction})
        
        // 
        // preWhitespace
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
        components.whitespace = new Token({string:extraction})

        
        // 
        // openBracket
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /\]/, from: remaining }); if (extraction == null) { return null }
        components.closeBracket = new Token({string:extraction})
        
        // 
        // postWhitespace
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
        components.postWhitespace = new Token({string:extraction})
        
        // 
        // comment
        // 
        if (context.name != "key") {
            components.comment = converters.Comment.xdataStringToNode({
                string: remaining,
                context: context.advancedBy(
                    (components.preWhitespace||'')+(components.openBracket||'')+(components.whitespace||'')+(components.closeBracket||'')+(components.postWhitespace||'')
                ),
            })
        }
        
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
        if (contextName == "key") {
            node.childComponents.preWhitespace = null
            node.childComponents.comment = null
        }
        return convertComponent({
            component: Object.values(node.childComponents),
            parent:node,
            contextName
        })
    }
})