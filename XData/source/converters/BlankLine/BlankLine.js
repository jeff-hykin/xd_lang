import { Token, Node, createConverter } from "../../structure.js"
import * as utils from "../../utils.js"
import * as tools from "../../xdataTools.js"

// 
// 
// forms 
// 
// 
class BlankLine extends Node {
    converterName = "BlankLine"
    components = {
        whitespace: null, // token
    }
}

// 
// converter
// 
class Comment extends Converter {
    coreToNode({remainingString, form}) {
        var remaining = remainingString
        let components = {
            preWhitespace: null, // token
            commentSymbol: null, // token
            content: null, // token
            newline: null, // token
        }

        // 
        // leading whitespace
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: / */, from: remaining }); if (extraction == null) { return null }
        components.preWhitespace = new Token({string:extraction})

        // 
        // comment symbol
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /# |#(?=\n)/, from: remaining }); if (extraction == null) { return null }
        components.commentSymbol = new Token({string:extraction})

        // 
        // comment symbol
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /.*/, from: remaining }); if (extraction == null) { return null }
        components.content = new Token({string:extraction})

        // 
        // newline
        // 
        var { remaining, extraction } = utils.extractFirst({ pattern: /\n?/, from: remaining }); if (extraction == null) { return null }
        components.content = new Token({string:extraction})
        
        // 
        // return
        // 
        return new CommentNode({
            components,
        })
    }
    fixUpNode({ nodeWithModifications, originalNode }) {
        // set default form if needed
        if (nodeWithModifications.form    == null) { nodeWithModifications.form    = originalNode.form    || "indentedValue" }
        if (nodeWithModifications.newline == null) { nodeWithModifications.newline = originalNode.newline || "\n" }
        nodeWithModifications.commentSymbol = "# " // it should always equal this
        // TODO: probably could do better
        return nodeWithModifications
    }
}


module.exports = {
    Comment,
}