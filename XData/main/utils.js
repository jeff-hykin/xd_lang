import { toString, findAll } from "https://deno.land/x/good@1.3.0.4/string.js"

export {
    toString as toString
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