const { StringLocation, Token } = require("./structure")
const utils = require("./utils")

const calculateEndLocation = ({startLocation, string}) => {
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

const createRegexTokenMaker = ({name, regex}) => ({ remainingString, startLocation }) => {
    let { remaining, extraction } = utils.extractFirst({ pattern: regex, from: remainingString })
    if (extraction == null) {
        return {
            remaining,
            token: null,
        }
    } else {
        return {
            remaining,
            token: new Token({
                attributeName: name,
                string: extraction,
            }),
        }
    }
}