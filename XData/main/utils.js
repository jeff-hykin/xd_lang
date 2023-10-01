import { capitalize, indent, toCamelCase, digitsToEnglishArray, toPascalCase, toKebabCase, toSnakeCase, toScreamingtoKebabCase, toScreamingtoSnakeCase, toRepresentation, toString, regex, findAll, iterativelyFindAll, escapeRegexMatch, escapeRegexReplace, extractFirst, isValidIdentifier } from "https://deno.land/x/good@1.5.0.0/string.js"
import { iter, next, Stop, Iterable, map, filter, reduce, frequencyCount, zip, count, enumerate, permute, combinations, slices, asyncIteratorToList, concurrentlyTransform, forkBy } from "https://deno.land/x/good@1.5.0.0/iterable.js"

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

// FIXME: untested
export const extractBlock = (string)=>{
    let baseIndent = null
    const chunks = []
    let charIncrement = 0
    for (const eachMatch of iterativelyFindAll(/.*/, string)) {
        const eachLine = eachMatch[0]
        // havent initialized
        if (baseIndent == null) {
            baseIndent = eachLine.match(/^[ \t]*/)
            chunks.push(eachLine.slice(baseIndent.length,))
            charIncrement += eachLine.length
        } else {
            const eachMatch = eachLine.match(/^([ \t]*)(.*)/)
            const eachIndent = eachMatch[1]
            const eachContent = eachMatch[2]
            if (eachIndent.length < baseIndent) {
                break
            } else {
                chunks.push(eachIndent.slice(baseIndent.length,)+eachContent)
                charIncrement += eachLine.length
            }
        }
    }
    charIncrement += chunks.length-1 // +1 for each newline
    return {
        extraction: "\n".join(chunks),
        remaining: string.slice(charIncrement,),
    }
}