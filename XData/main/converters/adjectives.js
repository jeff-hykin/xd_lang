import * as structure from "../structure.js"
import { ParserError, ContextIds }   from "../structure.js"
import * as tools from "../xdata_tools.js"
import * as utils from "../utils.js"

export const adjectiveToNode =  ({ remaining, context }) => {
    const childComponents = {
        preWhitespace: null, // string
        content: null, // string
        postWhitespace: null, // string
    }

    // 
    // preWhitespace
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: /^ */, from: remaining, context })
    childComponents.preWhitespace = extraction

    // 
    // content
    // 
        // NOTE: enforces lower case for now, maybe expand later
    var { remaining, extraction, context } = tools.extract({ pattern: /^[a-z_][a-z_0-9]*/, from: remaining, context })
    childComponents.content = extraction
    
    // 
    // postWhitespace
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: /^ */, from: remaining, context })
    childComponents.postWhitespace = extraction
    
    // 
    // return
    // 
    return new structure.Node({
        toStringifier: "Token",
        childComponents,
        formattingInfo: {},
    })
}

export const adjectivesPrefixToNode =  ({ remaining, context }) => {
    const childComponents = {
        preWhitespace: null, // token
        openingParenthesis: null,
        content: [], // array
        trailingWhitespace: null,
        closingParenthesis: null,
        postWhitespace: null, // token
    }

    // 
    // preWhitespace
    //
    var { remaining, extraction, context } = tools.extract({ pattern: /^ */, from: remaining, context })
    childComponents.preWhitespace = extraction
    
    // 
    // (
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: /^\(/, from: remaining, context })
    childComponents.openingParenthesis = extraction

    // 
    // content
    // 
    var content = []
    // get first adjective (must be at least one)
    var { remaining, extraction, context } = tools.extract({ pattern: adjectiveToNode, from: remaining, context })
    content.push(extraction)
    // get any other adjectives
    while (true) {
        try {
            var { remaining, extraction, context } = tools.extract({ pattern: /^, */, from: remaining, context })
            content.push(extraction)
            var { remaining, extraction, context } = tools.extract({ pattern: adjectiveToNode, from: remaining, context })
            content.push(extraction)
        } catch (error) {
            break
        }
    }
    // trailing whitespace without a comma
    var { remaining, extraction, context } = tools.extract({ pattern: /^ */, from: remaining, context })
    content.push(extraction)
    childComponents.content = content
    
    // 
    // )
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: /^\)/, from: remaining, context })
    childComponents.closingParenthesis = extraction

    // 
    // postWhitespace
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: /^ */, from: remaining, context })
    childComponents.postWhitespace = extraction
    
    // 
    // return
    // 
    return new structure.Node({
        toStringifier: "Token",
        childComponents,
        formattingInfo: {},  
    })
}