console.log("Starting Node.js")
const keypress = require('keypress')
const request = require('request')
const readline = require('readline')
const colors = require('colors')
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})
var http = require('http')
var {listenPort} = require('./config.json')
console.log("Started".brightGreen)
http.createServer(function (req, res) {
    console.log("Responded to a request".brightGreen)
    res.writeHead(200, {'Content-Type':'text/html'})
    res.write("Hello World!")
    res.end()
}).listen(listenPort)