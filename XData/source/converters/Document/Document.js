import { Token, Node, createConverter, converters, convertComponent } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

// context.name
    // checks for: []
    // creates: [ "topLevel" ]

export const Document = createConverter({
    decoderName: "Document",
    // Document should be the only one with a default context
    xdataStringToNode({ string, context=new Context({ name: "topLevel", stringIndex: 0, lineIndex: 0, columnIndex: 0 }) }) {
        const originalContext = context
        var remaining = string
        // only works in top level
        if (context.name != "topLevel") {
            return null
        }
        
        let components = {
            beforeValue: [],
            value: null, // node
            afterValue: [],
        }
        
        // 
        // beforeValue
        // 
        var node = true
        while (node) {
            var { node, remaining, context } = converters.CommentOrBlankLine.xdataStringToParsed({ remaining, context })
            if (node) {
                components.beforeValue.push(node)
            }
        }
        // 
        // list
        // 
            // FIXME: literally all other converters need to be defined before this one can be completed
        
        // 
        // afterValue
        // 

        // 
        // return
        // 
        return new Node({
            decodeAs: "Document",
            originalContext,
            childComponents: components,
            formattingInfo: {},  
        })
    },
    // nodeToXdataString(node) {
    //      // defaults to combining all childComponents
    // }
})