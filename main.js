console.log("Starting Node.js")
const keypress = require('keypress')
const request = require('request')
const readline = require('readline')
const colors = require('colors')
const fs = require('fs')
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})
var http = require('http')
var {listenPort} = require('./config.json')
var supportedFileTypes = (JSON.parse(fs.readFileSync("./assets/supportedFileTypes.json"))).data
console.log("Started".brightGreen)

http.createServer(function (req, res) {
    console.log(("RESPONDING ".brightGreen)+req.url)
    let noError = true
    // index.html
    try {
        if(!req.url.includes(".")){
            var readDir = fs.readdirSync(("./html"+req.url))
        }
    }catch(e){
        if(e){
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
    if(noError && !req.url.includes(".")){
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