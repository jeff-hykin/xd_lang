import * as utils from "./utils.js" 

export const minimumViableQuoteSize = (stringContent, quote) => {
    if (stringContent == null || quote == null) {
        return null
    }
    let quotes = utils.findAll(RegExp(`${quote}+`), stringContent)
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

export const extractStartingQuote = (quoteString) => {
    if (quoteString == null) {
        return null
    }
    const currentSize = quoteString.length
    // find the nearest power of three (floor)
    let quoteSizeGuess = 1
    while (true) {
        if (quoteSizeGuess == currentSize) {
            break
        } else if (quoteSizeGuess > currentSize) {
            quoteSizeGuess /= 3
            break
        }
        quoteSizeGuess *= 3
    }
    // fix any precision issues
    quoteSizeGuess = Math.round(quoteSizeGuess)
    // return the remaining string
    return {
        extraction: quoteString.slice(0, quoteSizeGuess),
        remaining: quoteString.slice(quoteSizeGuess,quoteString.length),
    }
}

export const oneOf = ({converters, remaining, context }) => {
    for (const eachConverter of converters) {
        var { node, remaining, context } = eachConverter.xdataStringToParsed({ remaining, context })
        if (node) {
            return { node, remaining, context }
        }
    }
    return { null, remaining, context }
}