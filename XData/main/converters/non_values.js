import * as structure from "../structure.js"
import * as tools from "../xdata_tools.js"
import * as utils from "../utils.js"

export const encodeBlankLine = ({remaining, context})=>{
    const childComponents = {
        whitespace: null,
        newline: null,
    }

    // 
    // whitespace
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: / */, from: remaining, context })
    childComponents.whitespace = extraction

    // newline
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: /(\n|$)/, from: remaining, context })
    childComponents.newline = extraction
    
    return new structure.Node({
        decoder: "BlankLine",
        childComponents,
        formattingPreferences: {},
    })
}

export const encodeComment = ({remaining, context})=>{
    const childComponents = {
        preWhitespace: null,
        commentSymbol: null,
        content: null,
        newline: null,
    }

    // 
    // leading whitespace
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: / */, from: remaining, context })
    childComponents.preWhitespace = extraction

    // 
    // comment symbol
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: /# |#(?=\n)/, from: remaining, context })
    childComponents.commentSymbol = extraction

    // 
    // content
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: /.*/, from: remaining, context })
    childComponents.content = extraction

    // 
    // newline
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: /\n?/, from: remaining, context })
    childComponents.newline = extraction
    
    return new structure.Node({
        decoder: "Comment",
        childComponents,
        formattingPreferences: {},
    })
}

structure.Converter({
    xdataStringToNode: {
        BlankLine: encodeBlankLine,
        Comment: encodeComment,
        CommentOrBlankLine:({remaining, context})=>{
            var { remaining, extraction, context } = tools.extract({
                oneOf: [
                    encodeComment,
                    encodeBlankLine,
                ],
                from: remaining,
                context,
            })
            return extraction
        },
    },
    nodeToXdataString: {
        BlankLine: ({node, context})=>structure.childComponentsToString({node, context}),
        Comment: ({node, context})=>structure.childComponentsToString({node, context}),
    },
})