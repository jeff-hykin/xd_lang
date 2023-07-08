import * as structure from "../structure.js"
import { ParserError, ContextIds } from "../structure.js"
import * as tools from "../xdata_tools.js"
import * as utils from "../utils.js"
import "./0_0_non_values.js"
import { capitalize, indent, toCamelCase, digitsToEnglishArray, toPascalCase, toKebabCase, toSnakeCase, toScreamingtoKebabCase, toScreamingtoSnakeCase, toRepresentation, toString, regex, escapeRegexMatch, escapeRegexReplace, extractFirst, isValidIdentifier, findAll } from "https://deno.land/x/good@1.3.0.4/string.js"

import { adjectivesPrefixToNode } from "./0_1_adjectives.js"

// 
// helpers
// 
    export const extractStartingQuote = ({from, context, quote}) => {
        let totalCount = 0
        let startSize = 1
        while (from[totalCount] == quote) {
            totalCount += 1
            if (totalCount >= startSize*3) {
                startSize = startSize*3
            }
        }
        if (totalCount == 0) {
            throw new structure.ParserError({ message: `cant extract starting quote from: ${from}`, context })
        }

        return tools.extract({
            pattern: regex`^${from.slice(0, startSize)}`,
            from,
            context,
        })
    }

    export const minimumViableQuoteSize = (stringContent, quote) => {
        if (stringContent == null || quote == null) {
            return null
        }
        let quotes = findAll(new RegExp(`${quote}+`), stringContent)
        let maxQuoteSize = Math.max(...quotes.map(each=>each[0].length))
        let minViableQuoteSize = 1
        if (maxQuoteSize > 0) {
            let logBase = 3
            let logOfSizeBaseThree = Math.log(maxQuoteSize+1) / Math.log(logBase)
            let closestLargerPowerOfThree = Math.ceil(logOfSizeBaseThree)
            minViableQuoteSize = 3**closestLargerPowerOfThree
        }
        return minViableQuoteSize
    }

// 
// string => stringNode
// 
    export const stringToNode = ({remaining, context})=>{
        if (context.id == ContextIds.mapKey) {
            // literal with no newlines
            return inlineStringLiteralToNode({remaining, context})
        } else {
            var theError
            // if inlineStringLiteralToNode matches, then all good in any context
            try {
                return inlineStringLiteralToNode({remaining, context})
            } catch (error) {
                theError = error
                // only catch parse errors
                if (!(error instanceof structure.ParserError)) {
                    throw error
                }
            }

            if (context.id == ContextIds.block) {
                return blockStringLiteralToNode({remaining, context})
            }

            // FIXME: this is only because of not-implement stuff
            if (theError) {
                throw theError
            }

            throw Error(`not implemented`)
        }
    }

    // 
    // literal string => node
    // 
        export const inlineStringLiteralToNode = ({remaining, context})=>{
            const childComponents = {
                adjectivesPrefix: null, // token
                preWhitespace: null, // string
                openingQuote: null, // string
                content: null, // string
                closingQuote: null, // string
                postWhitespace: null, // string
                comment: null, // node
            }

            // 
            // adjectivesPrefix
            // 
            try {
                var { remaining, extraction, context } = tools.extract({ pattern: adjectivesPrefixToNode, from: remaining, context })
                childComponents.adjectivesPrefix = extraction
            } catch (error) {
                if (!(error instanceof ParserError)) {
                    throw error
                }
            }

            // 
            // preWhitespace
            // 
            var { remaining, extraction, context } = tools.extract({ pattern: /^ */, from: remaining, context })
            childComponents.preWhitespace = extraction
            
            // 
            // openingQuote
            // 
            var { remaining, extraction, context } = extractStartingQuote({ quote: `"`, from: remaining, context })
            childComponents.openingQuote = extraction
            
            // 
            // content
            // 
            var { remaining, extraction, context } = tools.extract({
                pattern: regex`${  /^[^\n]*/  }${  childComponents.openingQuote  }`,
                from: remaining,
                context 
            })
            childComponents.content = extraction.slice(0,-childComponents.openingQuote.length)

            // 
            // closingQuote
            // 
            childComponents.closingQuote = childComponents.openingQuote
            

            // 
            // postWhitespace
            // 
            var { remaining, extraction, context } = tools.extract({ pattern: /^ */, from: remaining, context })
            childComponents.postWhitespace = extraction
            
            // 
            // comment is optional in certain contexts
            // 
            if (context.id != ContextIds.mapKey && context.id != ContextIds.referencePath) {
                try {
                    childComponents.comment = structure.toNodeifiers.Comment({ remaining, context })
                } catch (error) {
                    // only catch parse errors
                    if (!(error instanceof structure.ParserError)) {
                        throw error
                    }
                }
            }

            // 
            // return
            // 
            return new structure.Node({
                toStringifier: "String",
                childComponents,
                formattingPreferences: {},
            })
        }

        export const blockStringLiteralToNode = ({remaining, context})=>{
            const childComponents = {
                adjectivesPrefix: null, // token
                leadingCommentsAndLines: null, // array of nodes
                openingQuote: null, // string
                preWhitespace: null, // string
                content: null, // string
                closingQuote: null, // string
                postWhitespace: null, // string
                trailingCommentsAndLines: null, // array of nodes
            }

            // 
            // adjectivesPrefix
            // 
            try {
                var { remaining, extraction, context } = tools.extract({ pattern: adjectivesPrefixToNode, from: remaining, context })
                childComponents.adjectivesPrefix = extraction
            } catch (error) {
                if (!(error instanceof ParserError)) {
                    throw error
                }
            }

            // 
            // comments are optional before first quote
            //
            var { remaining, extraction, context } = tools.extract({
                pattern: structure.toNodeifiers.CommentOrBlankLine,
                from: remaining,
                context,
                repeat: true, // allows for zero matches
            })
            childComponents.leadingCommentsAndLines = extraction


            // figure out indent
            var { remaining, extraction, context } = tools.extract({ pattern: /^ */, from: remaining, context })
            const indent = extraction
            childComponents.openingQuote = indent
            
            // 
            // openingQuote
            // 
            var { remaining, extraction, context } = extractStartingQuote({ quote: `"`, from: remaining, context })
            const openingQuote = extraction
            childComponents.openingQuote += extraction
            var { remaining, extraction, context } = tools.extract({ pattern: /^ */, from: remaining, context })
            childComponents.preWhitespace = extraction
            var { remaining, extraction, context } = tools.extract({ pattern: /^\n/, from: remaining, context })
            childComponents.openingQuote += extraction
            
            // 
            // content
            // 
            var { remaining, extraction, context } = tools.extract({
                pattern: regex`${/(.|\s)*?\n/}${indent}${openingQuote}`,
                from: remaining,
                context 
            })
            childComponents.content = extraction.slice(0,-(childComponents.openingQuote.length)).replace(regex`^${indent}`.mg, "")

            // 
            // closingQuote
            // 
            childComponents.closingQuote = "\n"+childComponents.openingQuote
            
            // 
            // postWhitespace
            // 
            var { remaining, extraction, context } = tools.extract({ pattern: /^ */, from: remaining, context })
            childComponents.postWhitespace = extraction
            
            // 
            // comments are optional after newline of last quote
            // 
            var { remaining, extraction, context } = tools.extract({
                pattern: structure.toNodeifiers.CommentOrBlankLine,
                from: remaining,
                context,
                repeat: true, // allows for zero matches
            })
            childComponents.trailingCommentsAndLines = extraction

            // 
            // return
            // 
            return new structure.Node({
                toStringifier: "String",
                childComponents,
                formattingPreferences: {},
            })
        }

// 
// stringNode => string
// 
    export const stringNodeToString = ({node, context})=>{
        // TODO: automatically determine the best format, starting by defaulting to the given format, but falling back if needed depending on context and chosen formatting options
        
        // remove the comment if in a place where the comment isn't allowed
        if (context.id == ContextIds.mapKey || context.id == ContextIds.referencePath) {
            // TODO: should probably preserve node class
            node = {...node}
            node.childComponents = {...node.childComponents}
            // remove comments (from both inline and block)
            delete node.childComponents.comment
            delete node.childComponents.leadingCommentsAndLines
            delete node.childComponents.trailingCommentsAndLines
        }

        return inlineStringNodeToString({node, context})
    }

    // 
    // inline
    // 
        export const inlineStringNodeToString = ({node, context}) => {
            const numberOfQuotes = minimumViableQuoteSize(node.childComponents.content, `"`)
            node.childComponents.closingQuote = node.childComponents.openingQuote = `"`.repeat(numberOfQuotes)
            return structure.childComponentsToString({node, context})
        }


structure.RegisterConverter({
    toNode: {
        String: stringToNode,
    },
    toString: {
        String: stringToNode,
    },
})