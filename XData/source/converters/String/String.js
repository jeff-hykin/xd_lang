const { Token, Node, createConverter } = require("../../structure")
const utils = require("../../utils")
const tools = require("../../xdataTools")

createConverter({
    decoderName: "String",
    xdataStringToNode({ string, context }) {
        var remaining = string
        let childComponents 
        switch (context.name) {
            case "topLevel":
                
                break
            case "key":
                // 
                // 
                // parse
                // 
                // 
                    childComponents = {
                        openingQuote: null, // token
                        content: null, // token
                        closingQuote: null, // token
                        postWhitespace: null, // token
                    }

                    // 
                    // first quote
                    // 
                    var { remaining, extraction } = utils.extractFirst({ pattern: /"+/, from: remaining })               ; if (extraction == null) { return null }
                    var { remaining: remainingQuotes, extraction: openingQuote } = tools.extractStartingQuote(extraction);if (openingQuote.length == 0) { return null }
                    childComponents.openingQuote = new Token({string:openingQuote})
                    remaining = remainingQuotes+remaining
                    
                    //
                    // content
                    //
                    var { remaining, extraction } = utils.extractFirst({ pattern: RegExp(`^[^\n]*?${openingQuote}`), from: remaining }); if (extraction == null) { return null }
                    childComponents.content      = new Token({string:extraction.slice(0,-childComponents.openingQuote.length)                 })
                    childComponents.closingQuote = new Token({string:extraction.slice(-childComponents.openingQuote.length, extraction.length)})

                    // 
                    // trailing whitespace
                    // 
                    var { remaining, extraction } = utils.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
                    childComponents.postWhitespace = new Token({string:extraction})

                // 
                // return
                // 
                    return new Node({
                        decodeAs: "String",
                        context,
                        childComponents,
                        formattingInfo: {
                            quoteSize: childComponents.openingQuote.length,
                        },  
                    })
                break
            case "referenceEvaulation":
                childComponents = {
                    preWhitespace: null, // token
                    openingQuote: null, // token
                    content: null, // token
                    closingQuote: null, // token
                    postWhitespace: null, // token
                }
                break
            case "restOfLineValue":
                childComponents = {
                    preWhitespace: null, // token
                    openingQuote: null, // token
                    content: null, // token
                    closingQuote: null, // token
                    postWhitespace: null, // token
                    trailingComment: null, // comment node
                }
                break
            case "spanningLinesValue":
                childComponents = {
                    preWhitespace: null, // token
                    openingQuote: null, // token
                    postOpeningQuoteWhitespace: null, // token
                    postOpeningQuoteComment: null, // comment node
                    content: null, // token
                    closingQuote: null, // token
                    postWhitespace: null, // token
                    trailingComment: null, // comment
                }
                break
            case "indentedValue":
                childComponents = {
                    firstLineWhitespace: null, // token
                    firstLineTrailingComment: null, // comment node
                    preNodes: null, // list of blank lines nodes and comment nodes
                    preWhitespace: null, // token
                    openingQuote: null, // token
                    content: null, // token
                    closingQuote: null, // token
                    postWhitespace: null, // token
                    trailingComment: null, // comment
                    postNodes: null, // list of blank lines nodes and comment nodes
                }
                break
        
            default:
                throw Error(`[from xdataStringToNode()] Invalid context name. Context = ${JSON.stringify(context)}`)
                break
        }
    },
    nodeToXdataString(node) {
        const content = node.components.content
        const containsNewlines = !!content.match(/\n/g)
        
        // 
        // quote information
        // 
        let normalSize = 0
        try { normalSize = node.options.quoteSize } catch (error) {}
        if (!normalSize) { try { normalSize = node.components.openingQuote.length } catch (error) {} }
        if (!normalSize) { normalSize = 0 }
        let defaultQuoteType = undefined
        try { defaultQuoteType = node.components.openingQuote[0] } catch (error) {}
        const minimumDoubleQuoteSize = tools.minimumViableQuoteSize(content, `"`)
        const minimumSingleQuoteSize = tools.minimumViableQuoteSize(content, `'`)
        const doubleQuoteSize = Math.max(minimumDoubleQuoteSize, normalSize)
        const singleQuoteSize = Math.max(minimumSingleQuoteSize, normalSize)
        const doubleQuotes = (`"`).repeat(doubleQuoteSize)
        const singleQuotes = (`'`).repeat(singleQuoteSize)

        // 
        // main formatting decisions
        // 
        switch (node.context.name) {
            case "topLevel":
                
                break
            case "key":
                if (containsNewlines) {
                    // FIXME: need to create a figureative string instead 
                    throw Error(`Key contains newlines, but figureative strings are not yet implemented ref:293859yt3gbk`)
                }

                // 
                // combine everything
                // 
                return doubleQuotes + content + doubleQuotes + (node.postWhitespace || "")
                break
            case "referenceEvaulation":
                break
            case "restOfLineValue":
                
                break
            case "spanningLinesValue":
                
                break
            case "indentedValue":
                
                break
        
            default:
                throw Error(`[from nodeToXdataString()] Invalid context name. Context = ${JSON.stringify(node.context)}`)
                break
        }
    }
})