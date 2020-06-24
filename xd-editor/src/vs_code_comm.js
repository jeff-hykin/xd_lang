const commands = {
    EVAL: "xd_editor.evaluate",
}

// 
// HTML side
// 
function setupHtmlSide() {
    window.vscode = acquireVsCodeApi()

    // 
    // HTML sender
    //
    let vsCodeDo
    window.vsCodeDo = (string, data) => {
        // well...its good enough for a uuid in this case
        let uuid = Math.random()
        // tell the code to do something
        vscode.postMessage({
            command: commands.EVAL,
            uuid,
            code: string,
            data,
        })
        // put the resolver inside vsCodeDo.callbacks so that a
        // different part of the code can resolve the promise
        return new Promise((resolve)=>(vsCodeDo.callbacks[uuid]=resolve))
    }
    // 
    // HTML receiver
    //
    window.addEventListener("message", eventObj => {
        if (eventObj instanceof Object && eventObj.data instanceof Object) {
            switch (eventObj.data.command) {
                case commands.EVAL:
                    let { uuid, result } = eventObj.data
                    // call the callback of the correct thing(e.g use the uuid) and 
                    // give the callback the result
                    vsCodeDo.callbacks[uuid](result)
                    break;
            }
        }
    })
}

// 
// Extension side
// 
function setupExtensionSide({panel, context}) {
    panel.webview.onDidReceiveMessage(
        (message) => {
            switch (message.command) {
                // simply run and return the result for any evaluate request
                case commands.EVAL:
                    // this var is created so that the eval has access to it
                    let data = message.data
                    panel.webview.postMessage({
                        command: commands.EVAL,
                        uuid: message.uuid,
                        result: eval(message.code)
                    });
                    break;
            }
        },
        undefined,
        context.subscriptions
    )
}

// 
// export
// 
module || module = {}
module.exports || module.exports = {}
module.exports = {
    setupHtmlSide,
    setupExtensionSide,
}