const { Token, Node, Converter } = require("../../structure")
const utils = require("../../utils")
const tools = require("../../xdataTools")

// 
// 
// forms 
// 
// 
class StringLiteralKey extends Node {
    converterName = "StringLiteral"
    form = "key"
    options = {
        quoteSize: 1,
    }
    components = {
        openingQuote: null, // token
        content: null, // token
        closingQuote: null, // token
        postWhitespace: null, // token
    }
    static fromXdataString(string) {
        var remaining = string
        let components = {
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
        components.openingQuote = new Token({string:openingQuote})
        remaining = remainingQuotes+remaining
        
        //
        // content
        //
        var { remaining, extraction } = utils.extractFirst({ pattern: RegExp(`^[^\n]*?${openingQuote}`), from: remaining }); if (extraction == null) { return null }
        components.content      = new Token({string:extraction.slice(0,-components.openingQuote.length)                 })
        components.closingQuote = new Token({string:extraction.slice(-components.openingQuote.length, extraction.length)})

        // 
        // trailing whitespace
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
        components.postWhitespace = new Token({string:extraction})

        // 
        // return
        // 
        return new StringLiteralKey({
            components,
            options: {
                quoteSize: components.openingQuote.length,
            },  
        })
    }
}
class StringLiteralReferenceEvaulation extends Node {
    converterName = "StringLiteral"
    form = "referenceEvaulation"
    options = {
        quoteSize: 1,
    }
    components = {
        preWhitespace: null, // token
        openingQuote: null, // token
        content: null, // token
        closingQuote: null, // token
        postWhitespace: null, // token
    }
}
class StringLiteralRestOfLineValue extends Node {
    converterName = "StringLiteral"
    form = "restOfLineValue"
    options = {
        quoteSize: 1,
    }
    components = {
        preWhitespace: null, // token
        openingQuote: null, // token
        content: null, // token
        closingQuote: null, // token
        postWhitespace: null, // token
        trailingComment: null, // comment node
    }
}
class StringLiteralIndentedValue extends Node {
    converterName = "StringLiteral"
    form = "indentedValue"
    options = {
        quoteSize: 1,
        indent: null, // must be greater than 1, will be inherited if null
    }
    components = {
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
}
class StringLiteralSpanningLinesValue extends Node {
    converterName = "StringLiteral"
    form = "spanningLinesValue"
    options = {
        quoteSize: 1,
        indent: null, // must be greater than 1, will be inherited if null
    }
    components = {
        preWhitespace: null, // token
        openingQuote: null, // token
        postOpeningQuoteWhitespace: null, // token
        postOpeningQuoteComment: null, // comment node
        content: null, // token
        closingQuote: null, // token
        postWhitespace: null, // token
        trailingComment: null, // comment
    }
}


// 
// converter
// 
class StringLiteral extends Converter {
    coreToNode({remainingString, form}) {
        if (form == "key") {
            return StringLiteralKey.fromXdataString(remainingString)
        }
    }
    fixUpNode({ nodeWithModifications, originalNode }) {
        // FIXME: need to 
        return nodeWithModifications
    }
    nodeToXdataString(node) {

    }
}


module.exports = {
    StringLiteralKey,
    StringLiteralReferenceEvaulation,
    StringLiteralRestOfLineValue,
    StringLiteralIndentedValue,
    StringLiteralSpanningLinesValue,
}