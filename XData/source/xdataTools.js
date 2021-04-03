// const { StringLocation, Token } = require("./structure")
const utils = require("./utils")

module.exports.calculateEndLocation = ({startLocation, string}) => {
    if (string != null && startLocation != null) {
        const lines = string.split("\n")
        return new StringLocation({
            stringIndex: startLocation.stringIndex + string.length,
            lineIndex: startLocation.lineIndex + lines.length - 1,
            characterIndex: lines[0].length,
        })
    } else {
        return startLocation
    }
}

module.exports.minimumViableQuoteSize = (stringContent, quote) => {
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

module.exports.extractStartingQuote = (quoteString) => {
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