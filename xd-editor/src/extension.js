const vscode = require("vscode")
const path = require("path")
const { writeFileSync } = require("fs")
const { homedir } = require("os")
const { setupExtensionSide } = require("./vs_code_comm")

let context, panel

let getHtmlFilePath = (pathList)=> {
    vscode.Uri.file(path.join(context.extensionPath, ...pathList)).with({ scheme: "vscode-resource" })
}

let lastUsedImageUri = vscode.Uri.file(path.resolve(homedir(), "Desktop/code.png"))

const writeSerializedBlobToFile = (serializeBlob, fileName) => {
    const bytes = new Uint8Array(serializeBlob.split(","))
    writeFileSync(fileName, Buffer.from(bytes))
}

exports.activate = (contextArgument) => {
    context = contextArgument
    vscode.commands.registerCommand("xd.activate", () => {
        
        // 
        // tell VS Code how it should create the panel
        // 
        panel = vscode.window.createWebviewPanel(
            "XD Editor",
            "XD Editor",
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, "src"))],
            }
        )
        
        // 
        // setup responses to the webpanel requests
        // 
        setupExtensionSide()

        // 
        // give the webpanel it the HTML it needs
        // 
        panel.webview.html = `
            <html lang="en">
            <head>
                <script src="${getHtmlFilePath("src", "vs_code_comm.js")}"></script>
                <script src="${getHtmlFilePath("src", "main_webview.js")}"></script>
            </head>
            <body>
                Hello World!
            </body>
            </html>
        `
        
        // 
        // send it some init data from VS Code
        // 
        panel.webview.postMessage({
            type: "init",
            fontFamily,
            bgColor,
        })

        // 
        // deconstructor
        // 
        panel.onDidDispose(
            () => {
                // cleanup listeners i guess
            },
            null,
            context.subscriptions
        )

        // 
        // setup some listeners
        // 
        vscode.window.onDidChangeTextEditorSelection((e) => {
            panel.webview.postMessage({ type: "update" })
        })
    })
}