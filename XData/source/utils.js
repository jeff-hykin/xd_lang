export const findAll = (regexPattern, sourceString) => {
    let output = []
    let match
    // make sure the pattern has the global flag
    let regexPatternWithGlobal = RegExp(regexPattern,[...new Set("g"+regexPattern.flags)].join(""))
    while (match = regexPatternWithGlobal.exec(sourceString)) {
        // get rid of the string copy
        delete match.input
        // store the match data
        output.push(match)
    } 
    return output
}

export const indent = ({string, indent}) => {
    return string.replace(/(^|\n)/g, `$1${indent}`)
}

export const extractFirst = ({ pattern, from }) => {
    let match = from.match(pattern)
    if (match) {
        return {
            remaining: from.slice(0, match.index)+ from.slice(match.index + match[0].length, from.length),
            extraction: match[0]
        }
    } else {
        return {
            remaining: from,
            extraction: null
        }
    }
}

// TODO: extract block