const { Token, Node, createConverter } = require("../../structure")
const utils = require("../../utils")
const tools = require("../../xdataTools")

// (commentToNode):
//     regex: "/ */"
//     regex: "/# /"
//     regex: "/.+/"
//     regex: "/\n|\z/"
createConverter({
    decoderName: "Comment",
    xdataStringToNode({ string, context }) {
        var remaining = string
        let childComponents = {
            preWhitespace: null, // token
            symbol: null, // token
            content: null, // token
            postWhitespace: null, // token
        }
        var { remaining, extraction: preWhitespace  } = utils.extractFirst({ pattern: / */   , from: remaining }); if (extraction == null) { return null }
        var { remaining, extraction: symbol         } = utils.extractFirst({ pattern: /# /   , from: remaining }); if (extraction == null) { return null }
        var { remaining, extraction: content        } = utils.extractFirst({ pattern: /.*/   , from: remaining }); if (extraction == null) { return null }
        var { remaining, extraction: postWhitespace } = utils.extractFirst({ pattern: /\n|\z/, from: remaining }); if (extraction == null) { return null }
        return new Node({
            decodeAs: "Comment",
            context,
            childComponents = {
                ...childComponents,
                preWhitespace, 
                symbol, 
                content, 
                postWhitespace, 
            },
            formattingInfo: {},  
        })
    },
})