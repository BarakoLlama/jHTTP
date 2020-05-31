console.log("Starting Node.js")
const keypress = require('keypress')
const request = require('request')
const readline = require('readline')
const colors = require('colors')
const fs = require('fs')
const url = require('url')
const dree = require('dree')
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})
var http = require('http')
var {listenPort, tickLength, allowSystemURLs, allowSystemTree} = require('./config.json')
var supportedFileTypes = (JSON.parse(fs.readFileSync("./assets/supportedFileTypes.json"))).data
var systemURLS = (JSON.parse(fs.readFileSync("./assets/systemURLs.json"))).data
var requiredAssets = Array("404.html", "supportedFileTypes.json", "unsupportedFileType.html", "systemURLs.json", "400.html", "200.html", "201.html", "204.html", "304.html", "403.html",
"500.html")
console.log("Started".brightGreen)

http.createServer(function (req, res) {
    console.log(("RESPONDING ".brightGreen)+req.url)
    let noError = true
    let query = url.parse(req.url, true).query
    // Ensure URL doesn't end with /
    if(!res.writableEnded && req.url.endsWith("/")){
        res.writeHead(400, {"Content-Type":"text/html"})
        res.write(fs.readFileSync("./assets/400.html"))
        res.end()
        console.log("WARNING ".brightYellow+"URL cannot end with a /")
    }
    // Check for system URLs
    if(!res.writableEnded && systemURLS.includes(req.url) && allowSystemURLs){
        if(req.url == "/sys/cookies"){
            res.writeHead(200, {"Content-Type":"text/plain"})
            res.write("OK")
            console.log(req.headers.cookie)
            res.end()
        }
        if(req.url == "/sys/tree"){
            if(allowSystemTree){
                res.writeHead(200, {"Content-Type":"text/plain"})
                res.write(dree.parse("./html"))
                res.end()
            }else{
                res.writeHead(403, {"Content-Type":"text/html"})
                res.write(fs.readFileSync("./assets/403.html"))
                res.end()
            }
        }
    }
    // index.html
    try {
        if(!req.url.includes(".")){
            var readDir = fs.readdirSync(("./html"+req.url))
        }
    }catch(e){
        if(e && !res.writableEnded){
            noError = false
            if(e.message.includes("no such file")){
                let notFound = e.message.split("'")[1].replace("./html", "")
                console.log("WARNING ".brightYellow+"Invalid request given: "+notFound)
                res.writeHead(404, {'Content-Type':'text/html'})
                res.write(fs.readFileSync("./assets/404.html"))
                res.end()
            }
        }
    }
    if(noError && !req.url.includes(".") && !res.writableEnded){
        if(readDir.includes("index.html")){
            res.writeHead(200, {"Content-Type":"text/html"})
            res.write(fs.readFileSync(("./html"+req.url+"/index.html")))
            res.end()
        }else{
            res.writeHead(404, {"Content-Type":"text/html"})
            res.write(fs.readFileSync("./assets/404.html"))
            res.end()
        }
    }
    // any.html
    if(!res.writableEnded && req.url.endsWith(".html")){
        noError = true
        try {
            var file = fs.readFileSync(("./html"+req.url))
        }catch(e){
            if(e){
                if(e.message.includes("no such file")){
                    noError = false
                    let notFound = e.message.split("'")[1].replace("./html", "")
                    console.log("WARNING ".brightYellow+"Invalid request given: "+notFound)
                    res.writeHead(404, {'Content-Type':'text/html'})
                    res.write(fs.readFileSync("./assets/404.html"))
                    res.end()
                }
            }
        }
        if(noError){
            res.writeHead(200, {"Content-Type":"text/html"})
            res.write(fs.readFileSync(("./html"+req.url)))
            res.end()
        }
    }
    // any.txt
    if(!res.writableEnded && req.url.endsWith(".txt")){
        noError = true
        try {
            var file = fs.readFileSync(("./html"+req.url))
        }catch(e){
            if(e){
                if(e.message.includes("no such file")){
                    noError = false
                    let notFound = e.message.split("'")[1].replace("./html", "")
                    console.log("WARNING ".brightYellow+"Invalid request given: "+notFound)
                    res.writeHead(404, {'Content-Type':'text/html'})
                    res.write(fs.readFileSync("./assets/404.html"))
                    res.end()
                }
            }
        }
        if(noError){
            res.writeHead(200, {"Content-Type":"text/plain"})
            res.write(fs.readFileSync(("./html"+req.url)))
            res.end()
        }
    }
    // Check for unsupported file type
    if(!res.writableEnded && req.url.includes(".")){
        let fileType = req.url.split(".")[1]
        if(!supportedFileTypes.includes(fileType)){
            res.writeHead(501, {"Content-Type":"text/html"})
            res.write(fs.readFileSync("./assets/unsupportedFileType.html"))
            res.end()
        }
    }
}).listen(listenPort)

keypress(process.stdin)
process.stdin.on('keypress', function(ch, key){
    if(key && key.name == 'r' && key.ctrl){
        stop()
    }
})

// Check for missing files
setTimeout(function () {
    let foundFiles = fs.readdirSync("./assets")
    let missing = Array()
    requiredAssets.forEach(function(item){
        if(!foundFiles.includes(item)){
            missing.push(item)
        }
    })
    if(missing.length > 0){
        missing.forEach(function(item){
            console.log("MISSING ITEM ".brightRed+item)
        })
    }
}, tickLength*1000)