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
console.log("Started".brightGreen)

http.createServer(function (req, res) {
    console.log(("Responding ".brightGreen)+req.url)
    let noError = true
    try {
        var readDir = fs.readdirSync(("./html"+req.url))
    }catch(e){
        if(e){
            noError = false
            if(e.message.includes("no such file")){
                let notFound = e.message.split("'")[1].replace("./html", "")
                console.log(("WARNING: Invalid request given: "+notFound).brightYellow)
                res.writeHead(404, {'Content-Type':'text/html'})
                res.write(fs.readFileSync("./assets/404.html"))
                res.end()
            }
        }
    }
    if(noError){
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
}).listen(listenPort)

keypress(process.stdin)
process.stdin.on('keypress', function(ch, key){
    if(key && key.name == 'r' && key.ctrl){
        stop()
    }
})