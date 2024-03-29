import { Token, Node, createConverter, converters, convertComponentToString } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

// context.name
    // checks for: [ "mapKey" ]
    // creates: []

export const CustomAdjectives = createConverter({
    decoderName: "CustomAdjectives",
    xdataStringToNode({ string, context }) {
        const originalContext = context
        var remaining = string
        let components = {
            preWhitespace: null, // token
            openParenthese: null,
            content: [], // array
            trailingWhitespace: null,
            closeParenthese: null,
            postWhitespace: null, // token
        }

        // 
        // preWhitespace
        // 
        if (context.name != "mapKey") {
            var { remaining, extraction } = utils.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
            context = context.advancedBy(components.preWhitespace = new Token({string:extraction}))
        }
        
        // 
        // (
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /\(/, from: remaining }); if (extraction == null) { return null }
        context = context.advancedBy(components.openParenthese = new Token({string:extraction}))

        // 
        // content
        // 
        while (true) {
            // try to get an adjective
            extraction = converters.Adjective.xdataStringToNode({
                string: remaining,
                context,
            })
            if (extraction == null) {
                break
            }
            context = context.advancedBy(extraction)
            components.content.push(extraction)
            // end of list (or should be)
            if (extraction.childComponents.comma == null) {
                break
            }
        }
        
        // 
        // trailingWhitespace
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
        context = context.advancedBy(components.trailingWhitespace = new Token({string:extraction}))

        // 
        // )
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /\)/, from: remaining }); if (extraction == null) { return null }
        context = context.advancedBy(components.closeParenthese = new Token({string:extraction}))
        
        // 
        // postWhitespace
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: / +| *$/, from: remaining }); if (extraction == null) { return null }
        context = context.advancedBy(components.postWhitespace = new Token({string:extraction}))
        
        // 
        // return
        // 
        return new Node({
            decodeAs: "CustomAdjectives",
            originalContext,
            childComponents: components,
            formattingInfo: {},  
        })
    },

    // FIXME: there's a problem with the commas. When turning this back into a string, it needs to make sure all the adjectives actually have a comma, and then do logic for if there was a trailing comma last time or not
})