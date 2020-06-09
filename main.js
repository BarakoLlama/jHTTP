console.log("Starting Node.js")
const keypress = require('keypress')
const request = require('request')
const readline = require('readline')
const colors = require('colors')
const fs = require('fs')
const url = require('url')
const dree = require('dree')
const jAuth = require('./assets/jAuthorization.js')
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})
var http = require('http')
var {listenPort, tickLength, allowSystemURLs, allowSystemTree, allowCrawling, maxConnectionsPerMinute} = require('./config.json')
var {logIpConnections, throttledConnectionTimeout, allowQueryURLs} = require('./config.json')
var supportedFileTypes = (JSON.parse(fs.readFileSync("./assets/supportedFileTypes.json"))).data
var systemURLS = (JSON.parse(fs.readFileSync("./assets/systemURLs.json"))).data
var bannedIPs = (JSON.parse(fs.readFileSync("./assets/bannedIPs.json"))).data
var queryURLs = (JSON.parse(fs.readFileSync("./assets/queryURLs.json"))).data
var requiredAssets = Array("404.html", "supportedFileTypes.json", "unsupportedFileType.html", "systemURLs.json", "400.html", "200.html", "201.html", "204.html", "304.html", "403.html",
"500.html", "systemHome.html", "opensearch.xml", "401.html", "jAuthorization.js")
var ddosIPs = Array()
var ddosStacks = Array()
console.log("Started".brightGreen)

function readCookies(request = http.IncomingMessage){
    let rawData = request.headers.cookie
    if((rawData == undefined) || (rawData == "") || (rawData == null)){return JSON.parse("{}")}
    let splitData = rawData.split(";")
    let jsonData = "{"
    splitData.forEach(function(line){
        let splitLine = line.split("=")
        jsonData = jsonData + '"' + splitLine[0] + '":"' + splitLine[1] + '",'
    })
    jsonData = jsonData.substr(0, (jsonData.length - 1)) + "}"
    return JSON.parse(jsonData)
}

http.createServer(function (req, res) {
    try {
        // Write to DDOS data
        if(ddosIPs.includes(req.connection.remoteAddress)){
            // Find ID
            let processingPart = 0
            let foundID = 0
            while(processingPart < ddosIPs.length){
                if(ddosIPs[processingPart] == req.connection.remoteAddress){
                    foundID = processingPart
                }
                processingPart++
            }
            // Add 1 to stacks
            processingPart = 0
            let newArray = Array()
            while(processingPart < ddosStacks.length){
                if(processingPart == foundID){
                    newArray.push(ddosStacks[processingPart] + 1)
                }else{
                    newArray.push(ddosStacks[processingPart])
                }
                processingPart++
            }
            ddosStacks = newArray
            // Is current connections over maximum allowed? If so, block connection.
            if(ddosStacks[foundID] > (maxConnectionsPerMinute/6)){
                res.writeHead(444, {"Content-Type":"text/plain"})
                res.write("jHTTP/444 No response (Connection throttled, please wait!)")
                res.end()
                console.log("WARNING ".brightYellow+"Too many connections from IP too fast! "+req.connection.remoteAddress)
            }
        }else{
            ddosIPs.push(req.connection.remoteAddress)
            ddosStacks.push(1)
        }
        // Log IP
        if(logIpConnections){
            console.log("LOG ".grey+"IP "+req.connection.remoteAddress)
        }
        // Check for IP ban
        if(bannedIPs.includes(req.connection.remoteAddress)){
            res.writeHead(444, {"Content-Type":"text/plain"})
            res.write("jHTTP/444 No response (IP Banned)")
            res.end()
        }
        console.log(("RESPONDING ".brightGreen)+req.url.split("?")[0])
        let noError = true
        let query = url.parse(req.url, true).query
        let cookies = readCookies(req)
        // Ensure URL doesn't end with /
        if(!res.writableEnded && req.url.endsWith("/") && !(req.url == "/")){
            res.writeHead(400, {"Content-Type":"text/html"})
            res.write(fs.readFileSync("./assets/400.html"))
            res.end()
            console.log("WARNING ".brightYellow+"URL cannot end with a /")
        }
        // Check for system URLs
        if(!res.writableEnded && systemURLS.includes(req.url.split("?")[0]) && allowSystemURLs){
            if(req.url.split("?")[0] == "/sys/cookies"){
                res.writeHead(200, {"Content-Type":"text/html"})
                res.write(JSON.stringify(cookies))
                res.end()
            }
            if(req.url.split("?")[0] == "/sys/tree"){
                if(allowSystemTree){
                    let beforeParse = dree.parse("./html")
                    let afterParse
                    let validCharacters = Array("a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
                    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V" ,"W", "X", "Y", "Z", ".", "\n", " ", "/", ">", "<")
                    let processingPart = 0
                    while(processingPart < beforeParse.length){
                        if(validCharacters.includes(beforeParse.substr(processingPart, 1))){
                            afterParse = afterParse + beforeParse.substr(processingPart, 1)
                        }
                        processingPart++
                    }
                    res.writeHead(200, {"Content-Type":"text/plain"})
                    res.write(afterParse)
                    res.end()
                }else{
                    res.writeHead(403, {"Content-Type":"text/html"})
                    res.write(fs.readFileSync("./assets/403.html"))
                    res.end()
                }
            }
            if(req.url.split("?")[0] == "/robots.txt"){
                res.writeHead(200, {"Content-Type":"text/plain"})
                if(allowCrawling){
                    res.write("User-Agent: *\nAllow: /*")
                }else{
                    res.write("User-Agent: *\nDisallow: /*")
                }
                res.end()
            }
            if(req.url.split("?")[0] == "/sys/freemoney"){
                res.writeHead(200, {"Content-Type":"text/html"})
                res.write(fs.readFileSync("./assets/important.html"))
                res.end()
            }
            if(req.url.split("?")[0] == "/sys"){
                res.writeHead(200, {"Content-Type":"text/html"})
                let part = fs.readFileSync("./assets/systemHome.html") + "\n<ul><li><p>/query</p></li>"
                // systemURLS
                systemURLS.forEach(function(item){
                    part = part + "<li><p>" + item + "</p></li>"
                })
                part = part + "</ul>"
                res.write(part)
                res.end()
            }
            if(req.url.split("?")[0] == "/opensearch.xml"){
                res.writeHead(200, {"Content-Type":"text/plain"})
                res.write(fs.readFileSync("./assets/opensearch.xml"))
                res.end()
            }
        }
        if(!res.writableEnded && systemURLS.includes(req.url.split("?")[0]) && !allowSystemURLs){
            res.writeHead(403, {"Content-Type":"text/html"})
            res.write(fs.readFileSync("./assets/403.html"))
            res.end()
        }
        // Check for query URLs
        if(!res.writableEnded && queryURLs.includes(req.url.split("?")[0]) && allowQueryURLs){
            if(req.url.split("?")[0] == "/query"){
                let resolution = "VALID ENDPOINTS\n"
                queryURLs.forEach(function(item){
                    resolution = resolution + item + "\n"
                })
                resolution = resolution + "\nVALID RESPONSES\nerr1 - Invalid syntax\nerr2 - No query with given name\nerr3 - No entry with given name\n"
                resolution = resolution + "err4 - Permission denied\nerr5 - Unknown error\nyay - Success\nOther responses indicate data.\n"
                resolution = resolution + "\nExample API request:\n/query/api?queryName=users&queryEntry=admins&action=write&toWrite=hello%20world\n"
                resolution = resolution + "Example permissions request:\n/query/api?queryName=users&queryEntry=null&action=getPerms\n\n"
                resolution = resolution + "API VARIABLES\nqueryName - Name of the database\nqueryEntry - An entry in the database\naction - [read, write, getPerms]\n"
                resolution = resolution + "(OPTIONAL) toWrite - Data to write to the database (only required if action=write)"
                res.writeHead(200, {"Content-Type":"text/plain"})
                res.write(resolution)
                res.end()
            }
            if(req.url.split("?")[0] == "/query/list"){
                let resolution = "LIST OF QUERIES\n"
                let dirs = fs.readdirSync("./query")
                dirs.forEach(function(queryx){
                    let hiddenFunc = (JSON.parse(fs.readFileSync("./query/"+queryx+"/settings.json"))).publicHidden
                    if(!hiddenFunc){
                        resolution = resolution + queryx + "\n"
                    }
                })
                res.writeHead(200, {"Content-Type":"text/plain"})
                res.write(resolution)
                res.end()
            }
            if(req.url.split("?")[0] == "/query/api"){
                // Get parameters
                var queryName
                var queryEntry
                var action
                var toWrite
                var settingsJson
                try {
                    queryName = query.queryName
                    queryEntry = query.queryEntry
                    action = query.action
                    toWrite = query.toWrite
                    settingsJson = JSON.parse(fs.readFileSync("./query/"+queryName+"/settings.json"))
                }catch(e){if(e){
                    res.writeHead(500, {"Content-Type":"text/plain"})
                    res.write("err1")
                    res.end()
                    settingsJson = {}
                }}
                var readable = settingsJson.publicReadable
                var writable = settingsJson.publicWritable
                var hidden = settingsJson.publicHidden
                // Anti-Injection Attack Implementation
                if((queryName.includes(".") || queryEntry.includes(".")) && !res.writableEnded){
                    res.writeHead(403, {"Content-Type":"text/html"})
                    res.write(fs.readFileSync("./assets/403.html")+'<p style="text-align:center">jQuery attack detected.</p>')
                    res.end()
                }
                // Ensure basic parameters
                if(!res.writableEnded){
                    if((action == undefined) || ((action == "getPerms") && (queryName == undefined))){
                        res.writeHead(500, {"Content-Type":"text/plain"})
                        res.write("err1")
                        res.end()
                    }else if((queryName == undefined) || (queryEntry == undefined) || ((action == "write") && (toWrite == undefined))){
                        res.writeHead(500, {"Content-Type":"text/plain"})
                        res.write("err1")
                        res.end()
                    }
                }
                console.log("jQuery ".brightGreen+req.url.split("?")[1])
                // Actions
                if(!res.writableEnded){
                    if(hidden){
                        res.writeHead(500, {"Content-Type":"text/plain"})
                        res.write("err4")
                        res.end()
                    }else if((action == "read") || (action == "write") || (action == "getPerms")){
                        var directoryRead
                        try {
                            directoryRead = fs.readdirSync("./query/"+queryName)
                        }catch(e){
                            if(e){
                                if(e.message.includes("no such file")){
                                    res.writeHead(500, {"Content-Type":"text/plain"})
                                    res.write("err2")
                                    res.end()
                                }else{
                                    res.writeHead(500, {"Content-Type":"text/plain"})
                                    res.write("err5")
                                    res.end()
                                }
                            }
                        }
                        if(!res.writableEnded){
                            if(action == "read"){
                                if(readable){
                                    if(directoryRead.includes(queryEntry)){
                                        res.writeHead(200, {"Content-Type":"text/plain"})
                                        res.write(fs.readFileSync("./query/"+queryName+"/"+queryEntry))
                                        res.end()
                                    }else{
                                        res.writeHead(500, {"Content-Type":"text/plain"})
                                        res.write("err3")
                                        res.end()
                                    }
                                }else{
                                    res.writeHead(500, {"Content-Type":"text/plain"})
                                    res.write("err4")
                                    res.end()
                                }
                            }
                            if(action == "write"){
                                if(writable){
                                    if(toWrite == undefined){
                                        res.writeHead(500, {"Content-Type":"text/plain"})
                                        res.write("err1")
                                        res.end()
                                    }else{
                                        var fixedData
                                        if(toWrite.includes("%")){
                                            fixedData = decodeURI(toWrite)
                                        }else{
                                            fixedData = toWrite
                                        }
                                        fs.writeFileSync(("./query/"+queryName+"/"+queryEntry), fixedData)
                                        res.writeHead(200, {"Content-Type":"text/plain"})
                                        res.write("yay")
                                        res.end()
                                    }
                                }else{
                                    res.writeHead(500, {"Content-Type":"text/plain"})
                                    res.write("err4")
                                    res.end()
                                }
                            }
                            if(action == "getPerms"){
                                function strbool(bool = Boolean()){if(bool){return true}else{return false}}
                                var dataToWrite = "readable:"+strbool(readable)+";\nwritable:"+strbool(writable)+";\nhidden:false;"
                                res.writeHead(200, {"Content-Type":"text/plain"})
                                res.write(dataToWrite)
                                res.end()
                            }
                        }
                    }else{
                        res.writeHead(500, {"Content-Type":"text/plain"})
                        res.write("err1")
                        res.end()
                    }
                }
            }
        }
        // Check for directory settings
        let directorySettingsJson = JSON.parse('{"viewAsDirectory":false,"directoryFooter":false,"hidden":false}')
        try {
            directorySettingsJson = JSON.parse(fs.readFileSync("./html"+req.url.split("?")[0]+"/directorySettings.json"))
        }catch(e){
            // Nothing needed here.
        }
        // Is the directory marked as hidden?
        if(directorySettingsJson.hidden && !res.writableEnded){
            res.writeHead(404, {"content-Type":"text/html"})
            res.write(fs.readFileSync("./assets/404.html"))
            res.end()
        }
        // Otherwise continue normally
        if(directorySettingsJson.viewAsDirectory && !res.writableEnded){
            let readDirec = Array()
            try {
                readDirec = fs.readdirSync("./html"+req.url.split("?")[0])
            }catch(e){
                // Nothing is required if not found.
            }
            let htmlContent = '<ul><li><a href="/">Home directory</a></li><li><a href="javascript:history.back()">Back</a></li>'
            readDirec.forEach(function(item){
                let link = req.url.split("?")[0] + "/" + item
                if(req.url.split("?")[0] == "/"){link = "/" + item}
                htmlContent = htmlContent + '<li><a href="' + link + '">' + item + '</a></li>'
            })
            htmlContent = htmlContent + "</ul>"
            res.writeHead(200, {"Content-Type":"text/html"})
            res.write(htmlContent)
            res.end()
        }
        // Does the directory exist but index.html isnt there? Then show directory as a default.
        let readDirecX = Array("<NOTHING>")
        try {
            readDirecX = fs.readdirSync("./html"+req.url.split("?")[0])
        }catch(e){
            // Nothing is required if not found.
        }
        if(!readDirecX.includes("<NOTHING>") && !readDirecX.includes("index.html") && !res.writableEnded){
            let readDirec = Array()
            try {
                readDirec = fs.readdirSync("./html"+req.url.split("?")[0])
            }catch(e){
                // Nothing is required if not found.
            }
            let htmlContent = '<h1 style="text-align:center">This directory does not have an index.</h1><h3 style="text-align:center">Here are some files instead!</h3>'
            htmlContent = htmlContent + '<ul><li><a href="/">Home directory</a></li><li><a href="javascript:history.back()">Back</a></li>'
            readDirec.forEach(function(item){
                let link = req.url.split("?")[0].split("?")[0] + "/" + item
                if(req.url.split("?")[0] == "/"){link = "/" + item}
                htmlContent = htmlContent + '<li><a href="' + link + '">' + item + '</a></li>'
            })
            htmlContent = htmlContent + "</ul>"
            res.writeHead(200, {"Content-Type":"text/html"})
            res.write(htmlContent)
            res.end()
        }
        // index.html
        try {
            if(!req.url.split("?")[0].includes(".")){
                var readDir = fs.readdirSync(("./html"+req.url.split("?")[0]))
            }
        }catch(e){
            if(e && !res.writableEnded){
                noError = false
                if(e.message.includes("no such file")){
                    let notFound = e.message.split("'")[1].replace("./html", "")
                    res.writeHead(404, {'Content-Type':'text/html'})
                    res.write(fs.readFileSync("./assets/404.html"))
                    res.end()
                }
            }
        }
        if(noError && !req.url.split("?")[0].includes(".") && !res.writableEnded){
            if(readDir.includes("index.html")){
                res.writeHead(200, {"Content-Type":"text/html"})
                let mainHtml = fs.readFileSync(("./html"+req.url.split("?")[0]+"/index.html"))
                if(directorySettingsJson.directoryFooter){
                    let readDirec = Array()
                    try {
                        readDirec = fs.readdirSync("./html"+req.url.split("?")[0])
                    }catch(e){
                        // Nothing is required if not found.
                    }
                    let htmlContent = '<footer><hr class="rounded"><ul><li><a href="/">Home directory</a></li><li><a href="javascript:history.back()">Back</a></li>'
                    readDirec.forEach(function(item){
                        let link = req.url.split("?")[0] + "/" + item
                        if(req.url.split("?")[0] == "/"){link = "/" + item}
                        htmlContent = htmlContent + '<li><a href="' + link + '">' + item + '</a></li>'
                    })
                    htmlContent = htmlContent + "</ul></footer>"
                    mainHtml = mainHtml + htmlContent
                }
                res.write(mainHtml)
                res.end()
            }else{
                res.writeHead(404, {"Content-Type":"text/html"})
                res.write(fs.readFileSync("./assets/404.html"))
                res.end()
            }
        }
        // any.html
        if(!res.writableEnded && req.url.split("?")[0].endsWith(".html")){
            noError = true
            try {
                var file = fs.readFileSync(("./html"+req.url.split("?")[0]))
            }catch(e){
                if(e){
                    if(e.message.includes("no such file")){
                        noError = false
                        res.writeHead(404, {'Content-Type':'text/html'})
                        res.write(fs.readFileSync("./assets/404.html"))
                        res.end()
                    }
                }
            }
            if(noError){
                res.writeHead(200, {"Content-Type":"text/html"})
                res.write(fs.readFileSync(("./html"+req.url.split("?")[0])))
                res.end()
            }
        }
        // any.txt
        if(!res.writableEnded && req.url.split("?")[0].endsWith(".txt")){
            noError = true
            try {
                var file = fs.readFileSync(("./html"+req.url.split("?")[0]))
            }catch(e){
                if(e){
                    if(e.message.includes("no such file")){
                        noError = false
                        res.writeHead(404, {'Content-Type':'text/html'})
                        res.write(fs.readFileSync("./assets/404.html"))
                        res.end()
                    }
                }
            }
            if(noError){
                res.writeHead(200, {"Content-Type":"text/plain"})
                res.write(fs.readFileSync(("./html"+req.url.split("?")[0])))
                res.end()
            }
        }
        // any.json
        if(!res.writableEnded && req.url.split("?")[0].endsWith(".json")){
            noError = true
            try {
                var file = fs.readFileSync("./html"+req.url.split("?")[0])
            }catch(e){
                if(e){
                    if(e.message.includes("no such file")){
                        noError = false
                        res.writeHead(404, {'Content-Type':'text/html'})
                        res.write(fs.readFileSync("./assets/404.html"))
                        res.end()
                    }
                }
            }
            if(noError){
                res.writeHead(200, {"Content-Type":"text/plain"})
                res.write(fs.readFileSync("./html"+req.url.split("?")[0]))
                res.end()
            }
        }
        // any.jpg
        if(!res.writableEnded && req.url.split("?")[0].endsWith(".jpg")){
            noError = true
            try {
                var file = fs.readFileSync("./html"+req.url.split("?")[0])
            }catch(e){
                if(e){
                    if(e.message.includes("no such file")){
                        noError = false
                        res.writeHead(404, {'Content-Type':'text/html'})
                        res.write(fs.readFileSync("./assets/404.html"))
                        res.end()
                    }
                }
            }
            if(noError){
                res.writeHead(200, {"Content-Type":"image/jpeg"})
                res.write(fs.readFileSync("./html"+req.url.split("?")[0]))
                res.end()
            }
        }
        // any.png
        if(!res.writableEnded && req.url.split("?")[0].endsWith(".png")){
            noError = true
            try {
                var file = fs.readFileSync("./html"+req.url.split("?")[0])
            }catch(e){
                if(e){
                    if(e.message.includes("no such file")){
                        noError = false
                        res.writeHead(404, {'Content-Type':'text/html'})
                        res.write(fs.readFileSync("./assets/404.html"))
                        res.end()
                    }
                }
            }
            if(noError){
                res.writeHead(200, {"Content-Type":"image/jpeg"})
                res.write(fs.readFileSync("./html"+req.url.split("?")[0]))
                res.end()
            }
        }
        // any.gif
        if(!res.writableEnded && req.url.split("?")[0].endsWith(".gif")){
            noError = true
            try {
                var file = fs.readFileSync("./html"+req.url.split("?")[0])
            }catch(e){
                if(e){
                    if(e.message.includes("no such file")){
                        noError = false
                        res.writeHead(404, {'Content-Type':'text/html'})
                        res.write(fs.readFileSync("./assets/404.html"))
                        res.end()
                    }
                }
            }
            if(noError){
                res.writeHead(200, {"Content-Type":"image/gif"})
                res.write(fs.readFileSync("./html"+req.url.split("?")[0]))
                res.end()
            }
        }
        // any.mp3
        if(!res.writableEnded && req.url.split("?")[0].endsWith(".mp3")){
            noError = true
            try {
                var file = fs.readFileSync("./html"+req.url.split("?")[0])
            }catch(e){
                if(e){
                    if(e.message.includes("no such file")){
                        noError = false
                        res.writeHead(404, {'Content-Type':'text/html'})
                        res.write(fs.readFileSync("./assets/404.html"))
                        res.end()
                    }
                }
            }
            if(noError){
                let toWrite = '<audio autoplay="autoplay" controls="controls"><source src="'+req.url.split("?")[0]+'src"/></audio>'
                res.writeHead(200, {"Content-Type":"text/html"})
                res.write(toWrite)
                res.end()
            }
        }
        if(!res.writableEnded && req.url.split("?")[0].endsWith(".mp3src")){ // Support for any.mp3
            noError = true
            try {
                let urlFix = req.url.split("?")[0].replace(".mp3src", ".mp3")
                var file = fs.readFileSync("./html"+urlFix)
            }catch(e){
                if(e){
                    if(e.message.includes("no such file")){
                        noError = false
                        res.writeHead(404, {'Content-Type':'text/html'})
                        res.write(fs.readFileSync("./assets/404.html"))
                        res.end()
                    }
                }
            }
            if(noError){
                res.writeHead(200, {"Content-Type":"audio/basic"})
                let urlFix = req.url.split("?")[0].replace(".mp3src", ".mp3")
                res.write(fs.readFileSync("./html"+urlFix))
                res.end()
            }
        }
        // any.mp4
        if(!res.writableEnded && req.url.split("?")[0].endsWith(".mp4")){
            noError = true
            try {
                var file = fs.readFileSync("./html"+req.url.split("?")[0])
            }catch(e){
                if(e){
                    if(e.message.includes("no such file")){
                        noError = false
                        res.writeHead(404, {'Content-Type':'text/html'})
                        res.write(fs.readFileSync("./assets/404.html"))
                        res.end()
                    }
                }
            }
            if(noError){
                let toWrite = '<video controls="" height="288" width="512"><source src="'+req.url.split("?")[0]+'src" type="video/mp4" />Your browser does not support the video tag.</video>'
                res.writeHead(200, {"Content-Type":"text/html"})
                res.write(toWrite)
                res.end()
            }
        }
        if(!res.writableEnded && req.url.split("?")[0].endsWith(".mp4src")){ // Support for any.mp4
            noError = true
            try {
                let urlFix = req.url.split("?")[0].replace(".mp4src", ".mp4")
                var file = fs.readFileSync("./html"+urlFix)
            }catch(e){
                if(e){
                    if(e.message.includes("no such file")){
                        noError = false
                        res.writeHead(404, {'Content-Type':'text/html'})
                        res.write(fs.readFileSync("./assets/404.html"))
                        res.end()
                    }
                }
            }
            if(noError){
                res.writeHead(200, {"Content-Type":"audio/basic"})
                let urlFix = req.url.split("?")[0].replace(".mp4src", ".mp4")
                res.write(fs.readFileSync("./html"+urlFix))
                res.end()
            }
        }
        // Check for unsupported file type
        if(!res.writableEnded && req.url.split("?")[0].includes(".")){
            let fileType = req.url.split("?")[0].split(".")[1]
            if(!supportedFileTypes.includes(fileType)){
                res.writeHead(501, {"Content-Type":"text/html"})
                res.write(fs.readFileSync("./assets/unsupportedFileType.html"))
                res.end()
            }
        }
    }catch(e){
        if(e){
            res.writeHead(500, {"Content-Type":"text/html"})
            res.write(fs.readFileSync("./assets/500.html"))
            res.end()
            console.log("ERROR ".brightRed+e.message)
            console.log("STACK ".brightRed+e.stack)
        }
    }
}).listen(listenPort).on('error', (e) => {
    if(e){
        if(e.message.includes("permission denied")){console.log("ERROR ".brightRed+"Permission denied. Try using a different port. Press Ctrl+R to restart.")}else{
            console.log("ERROR ".brightRed+"Unknown Error\n"+e.message)
        }
    }
})

keypress(process.stdin)
process.stdin.on('keypress', function(ch, key){
    if(key && key.name == 'r' && key.ctrl){
        stop()
    }
    if(key && key.name == 'o' && key.ctrl){
        rl.question('jHTTP> ', (answer) => {
            let answersplit = answer.split(" ")
            if(answersplit[0] == "help"){
                console.log("jquery help, jhttp [init]".brightCyan)
            }
            if(answersplit[0] == "jquery"){
                if(answersplit[1] == undefined){
                    console.log("try 'jquery help'".brightCyan)
                }
                if(answersplit[1] == "help"){
                    if(answersplit[2] == undefined){
                        console.log("try 'jquery help [list, new, query]'".brightCyan)
                    }
                    if(answersplit[2] == "list"){
                        console.log("jquery list - Lists available queries".brightCyan)
                    }
                    if(answersplit[2] == "new"){
                        console.log("jquery new <name> <publicReadable?> <publicWritable?> <publicHidden?>- Creates a new query".brightCyan)
                    }
                    if(answersplit[2] == "query"){
                        console.log("jquery query <name> [read, write] <entryName> OPTIONAL<data>".brightCyan)
                    }
                }
                if(answersplit[1] == "list"){
                    console.log(fs.readdirSync("./query"))
                }
                if(answersplit[1] == "new"){
                    if((answersplit[2] == undefined) || (answersplit[3] == undefined) || (answersplit[4] == undefined) || (answersplit[5] == undefined)){
                        console.log("ERROR ".brightRed+"Invalid command syntax")
                    }else{
                        fs.mkdirSync("./query/"+answersplit[2])
                        let toWrite = ('{"publicReadable":'+answersplit[3]+',"publicWritable":'+answersplit[4]+',"publicHidden":'+answersplit[5]+'}')
                        fs.writeFileSync(("./query/"+answersplit[2]+"/settings.json"), toWrite)
                        console.log("Success!".brightGreen)
                    }
                }
                if(answersplit[1] == "query"){
                    if((answersplit[2] == undefined) || (answersplit[3] == undefined) || (answersplit[4] == undefined)){
                        console.log("ERROR ".brightRed+"Invalid command syntax: Parameters need to be defined")
                    }else if((answersplit[5] == undefined) && (answersplit[3] == "write")){
                        console.log("ERROR ".brightRed+"Invalid command syntax: Parameter needs to be defined")
                    }else if(!(answersplit[3] == "read") && !(answersplit[3] == "write")){
                        console.log("ERROR ".brightRed+"Invalid command syntax: Parameter can only be read or write")
                    }else{
                        fs.readdir(("./query/"+answersplit[2]), (err, files) => {
                            if(err){
                                console.log("ERROR ".brightRed+"Query doesn't exist or access was denied")
                            }else{
                                if(answersplit[3] == "read"){
                                    fs.readFile(("./query/"+answersplit[2]+"/"+answersplit[4]), (err, data) => {
                                        if(err){
                                            console.log("ERROR ".brightRed+"Query doesn't exist or access was denied")
                                        }else{
                                            console.log("QUERY "+answersplit[2]+" = "+data.toString())
                                        }
                                    })
                                }else if(answersplit[3] == "write"){
                                    let toWrite = answer.replace(("jquery query "+answersplit[2]+" "+answersplit[3]+" "+answersplit[4]+" "), "")
                                    fs.writeFileSync(("./query/"+answersplit[2]+"/"+answersplit[4]), toWrite)
                                    console.log("Success!".brightGreen)
                                }
                            }
                        })
                    }
                }
            }
            if(answersplit[0] == "jhttp"){
                if(answersplit[1] == undefined){
                    console.log("jhttp help".brightCyan)
                }
                if(answersplit[1] == "help"){
                    if(answersplit[2] == undefined){
                        console.log("jhttp help [init]".brightCyan)
                    }
                    if(answersplit[2] == "init"){
                        console.log("jhttp init - Initiates opensearch.xml".brightCyan)
                    }
                }
                if(answersplit[1] == "init"){
                    var toWrite = '<?xml version="1.0" encoding="UTF-8" ?>\n<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">'
                    rl.question("Name of website? ", (answer) => {
                        toWrite = toWrite + "\n    <ShortName>" + answer + "</ShortName>"
                        rl.question("Does this website have adult content? YES/NO ", (answer) => {
                            let localAnswer = answer.toLowerCase()
                            var fixed = 'true' // Will be assumed so that bots scan for adult content as a failsafe.
                            if(localAnswer == "yes"){fixed = 'true'}
                            if(localAnswer == "no"){fixed = 'false'}
                            toWrite = toWrite + "\n    <AdultContent>" + fixed + "</AdultContent>"
                            rl.question("Is this website in english? (YES) Otherwise write the two-digit country code (FR) ", (answer) => {
                                if(answer.toLowerCase() == "yes"){
                                    toWrite = toWrite + "\n    <Language>EN</Language>"
                                }else{
                                    toWrite = toWrite + "\n    <Language>" + answer.toUpperCase() + "</Language>"
                                }
                                toWrite = toWrite + '\n    <Developer>GitHub/BarakoLlama</Developer>\n</OpenSearchDescription>'
                                fs.writeFileSync("./assets/opensearch.xml", toWrite)
                                console.log("Success!".brightGreen)
                            })
                        })
                    })
                }
            }
        })
    }
})

// Check for missing files
setInterval(function () {
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
// Clear DDOSing profiles
setInterval(function () {
    if(ddosIPs.length > 0){
        console.log("INFO ".brightCyan+"Cleared anti-DDOS profiles.")
    }
    ddosIPs = []
    ddosStacks = []
}, throttledConnectionTimeout*1000)