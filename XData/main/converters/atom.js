import * as structure from "../structure.js"
import { ParserError, CantDecodeContext, ContextIds }   from "../structure.js"
import * as tools from "../xdata_tools.js"
import * as utils from "../utils.js"

const encodeAtomWithAtSymbol = ({remaining, context})=>{
    // NOTE: no context restrictions beacuse this is a helper, and the main one should check context
    const childComponents = {
        preWhitespace: null, // token
        symbol: null, // token
        content: null, // token
        postWhitespace: null, // token
        comment: null, // node
    }

    // 
    // preWhitespace
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: / */, from: remaining, context })
    childComponents.preWhitespace = extraction
    
    // 
    // @-symbol itself
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: /@/i, from: remaining, context }); if (extraction == null) { return null }
    childComponents.symbol = extraction

    // 
    // content
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: /-?[a-zA-Z_][a-zA-Z_0-9]*/, from: remaining, context }); if (extraction == null) { return null }
    childComponents.content = extraction
    
    // 
    // postWhitespace
    // 
    var { remaining, extraction, context } = tools.extract({ pattern: / */, from: remaining, context })
    childComponents.postWhitespace = extraction
    
    // 
    // comment is optional
    // 
    try {
        components.comment = structure.decoders.Comment({ remaining, context })
    } catch (error) {
        // only catch parse errors
        if (!(error instanceof structure.ParserError)) {
            throw error
        }
    }

    // 
    // return
    // 
    return new structure.Node({
        decoder: "Atom",
        childComponents,
        formattingPreferences: {},
    })
}

structure.Converter({
    xdataStringToNode: {
        Atom: ({remaining, context})=>{
            const childComponents = {
                preWhitespace: null, // token
                symbol: null, // token
                content: null, // token
                postWhitespace: null, // token
                comment: null, // node
            }

            if (context.id == ContextIds.root) {
                return encodeAtomWithAtSymbol({ remaining, context })
            } else if (context.id == ContextIds.inlineValue) {
                return encodeAtomWithAtSymbol({ remaining, context })
            } else {
                throw new Error(`Unimplemented`)
            }
        },
    },
    nodeToXdataString: {
        Atom: ({node, context})=>{
            if (context.id == ContextIds.root) {
                return structure.childComponentsToString({node, context})
            } else if (context.id == ContextIds.inlineValue) {
                return structure.childComponentsToString({node, context})
            } else {
                throw Error(`Unimplemented`)
            }
        },
    },
})