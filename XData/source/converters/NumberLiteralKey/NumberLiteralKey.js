import { Token, Node, createConverter } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"
import { Comment } from "../Comment/Comment.js"
                                        
export const NumberLiteralKey = createConverter({
    decoderName: "NumberLiteralKey",
    xdataStringToNode({ string, context }) {
        var remaining = string
        // doesnt care about the context.name: "topLevel", "key", "referenceEvaulation", "restOfLineValue", "spanningLinesValue", "indentedValue"
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
        var { remaining, extraction } = utils.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
        components.preWhitespace = new Token({string:extraction})
        
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
        
        if (context.name != "key") {
            // 
            // comment
            // 
            components.comment = Comment.xdataStringToNode({
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
            decodeAs: "NumberLiteralKey",
            originalContext: context,
            childComponents: components,
            formattingInfo: {},  
        })
    },
    // nodeToXdataString(node) {
    //      // defaults to combining all childComponents
    // }
})