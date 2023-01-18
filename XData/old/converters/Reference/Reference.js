import { Token, Node, createConverter, converters, convertComponentToString, Context } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

// context.name
    // checks for: ["mapKey"]
    // creates: ["referencePath"]

// (Reference)[referencePath]:
//     regex: "/ */"
//     regex: "/#valueOf/"
//     regex: "/\[/"
//         loop:
//             regex: "/ */"
//             (Key): #DONE
//             regex: / */
//             regex: /,/
//             regex: / */
//     regex: "/ */"
//     regex: "/\]/"
//     regex: "/ */"

export const Reference = createConverter({
    decoderName: "Reference",
    xdataStringToNode({ string, context }) {
        const originalContext = context
        var remaining = string
        let components = {
            preWhitespace: null,
            systemToken: null,
            openingBracket: null,
            content: [],
            closingBracket: null,
            postWhitespace: null,
            comment: null,
        }

        // 
        // preWhitespace
        // 
        if (context.name != "mapKey") {
            var { remaining, extraction, context } = tools.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
            components.preWhitespace = new Token({string:extraction})
        }
        
        // 
        // symbol
        // 
        var { remaining, extraction, context } = tools.extractFirst({ pattern: /#valueOf/, from: remaining }); if (extraction == null) { return null }
        components.systemToken = new Token({string:extraction})

        // 
        // openingBracket
        // 
        var { remaining, extraction, context } = tools.extractFirst({ pattern: /\[/, from: remaining }); if (extraction == null) { return null }
        components.openingBracket = new Token({string:extraction})
        
        // 
        // content
        //
        while (1) {
            const item = Node({
                decodeAs: "Anonymous",
                originalContext: context,
                childComponents: {
                    preWhitespace: null,
                    content: null,
                    preCommaWhitespace: null,
                    comma: null,
                    postWhitespace: null,
                },
            })
            components.content.push(item)



            var { remaining, extraction, context } = tools.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
            item.preWhitespace = new Token({string:extraction})
            

            // 
            // element content
            // 
            var { node, remaining, context, } = converters.Key.xdataStringToParsed({
                remaining,
                context: new Context({...context, name: "referencePath" }) 
            })
            if (node == null) { return null }
            item.content = node

            
            var { remaining, extraction, context } = tools.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
            item.preCommaWhitespace = new Token({string:extraction})
            
            var { remaining, extraction, context } = tools.extractFirst({ pattern: /,/, from: remaining });
            if (extraction == null) {
                break
            }
            item.comma = new Token({string:extraction})

            var { remaining, extraction, context } = tools.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
            item.postWhitespace = new Token({string:extraction})
        }

        // 
        // closingBracket
        // 
        var { remaining, extraction, context } = tools.extractFirst({ pattern: /\]/i, from: remaining }); if (extraction == null) { return null }
        components.closingBracket = new Token({string:extraction})
        
        // 
        // postWhitespace
        // 
        var { remaining, extraction, context } = tools.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
        components.postWhitespace = new Token({string:extraction})
        
        // 
        // comment
        // 
        if (context.name != "mapKey") {
            var { node, remaining, context, } = converters.Comment.xdataStringToParsed({
                string: remaining,
                context: context,
            })
            components.comment = node
        }
        
        // 
        // return
        // 
        return new Node({
            decodeAs: "Reference",
            originalContext: originalContext,
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