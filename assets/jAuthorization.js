exports.jAuth = {
    Token: class jAuthToken {
        constructor(expirationInSeconds = Number(), maxUses = Number(), scopesJson){
            if(expirationInSeconds == undefined){
                throw new Error("expirationInSeconds must be defined.")
            }
            if(maxUses == undefined){
                throw new Error("maxUses must be defiend.")
            }
            this.token = this.getNewToken()
            this.expiration = expirationInSeconds
            this.maxUses = maxUses
            this.scopes = scopesJson
        }
        getNewToken(){
            let tokenChars = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
            "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2",
            "3", "4", "5", "6", "7", "8", "9", "-", "_"]
            var newToken = ""
            while(newToken.length < 32){
                newToken = newToken + tokenChars[Math.floor(Math.random() * tokenChars.length)]
            }
            return newToken
        }
        generateNewToken(){
            this.token = this.getNewToken()
        }
        expirationTick(){
            this.expiration--
            if(this.expiration == 0){this.token = undefined}
        }
        maxUsesTick(){
            this.maxUses--
            if(this.maxUses == 0){this.token = undefined}
        }
        toJSON(){
            return {"token":this.token,"expiration":this.expiration,"uses":this.maxUses,"error":null,"info":null}
        }
    },
    Manager: class jAuthManager {
        constructor(expirationInSeconds = Number(), maxUsesPerToken = Number()){
            this.defMaxUses = Infinity
            this.defExpiration = 3600
            if(expirationInSeconds !== undefined){this.defExpiration = expirationInSeconds}
            if(maxUsesPerToken !== undefined){this.defMaxUses = maxUsesPerToken}
            this.tokens = []
            this.instance = exports.jAuth
        }
        newToken(){
            var newx = new this.instance.Token(this.defExpiration, this.defMaxUses)
            this.tokens.push(newx)
            console.log(JSON.stringify(newx.toJSON()))
            return newx.toJSON()
        }
        getToken(tokenID = String()){
            var processingPart = 0
            while(processingPart < this.tokens.length){
                var reference = this.tokens[processingPart]
                if(reference.token == tokenID){
                    return JSON.stringify(reference.toJSON())
                }
                processingPart++
            }
        }
        revokeToken(tokenID = String()){
            var found = false
            this.tokens.forEach(function(token){
                if(token.token == tokenID){
                    
                    found = true
                    return {"info":"Success."}
                }
            })
            if(!found){return {"error":"There is no token with that ID."}}
        }
        isTokenValid(tokenID = String()){
            this.tokens.forEach(function(token){
                if(token.token == tokenID){
                    return true
                }
            })
            return false
        }
    }
}