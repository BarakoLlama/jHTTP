# jAuthorization Documentation for developers
Do you want to use jAuthorization outside of jHTTP? No problem!
## Importing jAuthorization and using it
In order to import and use jAuthorization for your HTTP/HTTPS server, use the following code.
```javascript
const jAuth = require('jAuthorization.js')
var jAuthManager = new jAuth.jAuth.Manager() // See classes/Manager
setInterval(() => {
    jAuthManager.tokens.forEach(function(token){
        token.expirationTick()
        if(token.token == undefined){
            jAuthManager.revokeToken(token.token)
        }
    })
}, 1000)
// For your API, have your body be this when making a new token:
var body = jAuthManager.newToken()
// For your API, have your body be this when getting a token:
var body = jAuthManager.getToken(token) // Make sure $token is defined. You can see if $token is valid via isTokenValid.
// For your API, have your body be this when destroying a token:
var body = jAuthManager.revokeToken(token) // Make sure $token is defined.You can see if $token is valid via isTokenValid.

// Each API return above is optional. For instance, you can only have the API be able to create and get tokens, but not
// remove them.
```
## Classes: jAuthToken
### Constructor: expirationInSeconds
Number(): The amount of seconds before the token is destroyed.
### Constructor: maxUses
Number(): The maximum amount of times the token can be used before it is destroyed.
### Constructor example
```javascript
const jAuth = require('jAuthorization.js')
var myToken = new jAuth.jAuth.Token(600, Infinity, {"read":true})
// Token expires after 10 minutes (600 seconds) and does not expire
// no matter how many times it is used before the 10 minute mark.
```
### Property: token
String(): The actual token ID.
### Property: expiration
Number(): The amount of seconds left before the token expires.
### Property: maxUses
Number(): The amount of uses left before the token expires.
### Property: scopes
JSON(): The data that accompanies the token, such as read or write permissions.
### Method: getNewToken
Creates a random token but does not use it as a new one.
```javascript
console.log(myToken.getNewToken())
```
### Method: generateNewToken
Creates a random token ID for the current token object.
```javascript
myToken.generateNewToken()
```
### Method: expirationTick
Tells the token that a second has passed.
```javascript
myToken.expirationTick()
```
### Method: maxUsesTick
Tells the token that the token was used.
```javascript
myToken.maxUsesTick()
```
### Method: toJSON
Converts the token into a JSON object for APIs.
```javascript
var body = myToken.toJSON()
```

## Classes: jAuthManager
### Constructor: expirationInSeconds (OPTIONAL)
Number(): The amount of seconds tokens expire after creation
### Constructor: maxUsesPerToken (OPTIONAL)
Number(): The amount of times a token can be 
### Constructor example
```javascript
const jAuth = require('jAuthorization.js')
var myManager = new jAuth.jAuth.Manager(Infinity, 1)
// This manager will create tokens that expire after one use.
```
### Property: defMaxUses
Number(): The maximum amount of uses for any new token created
### Property: defExpiration
Number(): The anount of seconds after a token is created that that token expires
### Property: tokens
Array(jAuthToken()): The list of tokens
### Property: instance
Object: The parent of jAuthManager, jAuth
### Method: newToken
Creates a new token and returns the JSON of that new token.
```javascript
var body = myManager.newToken()
```
### Method: getToken
Returns the token that is found, and returns a JSON.error object if none is found.
```javascript
var myToken = myManager.getToken(myTokenID)
```
### Method: revokeToken
Removes a token with a JSON.info return object or a JSON.error object if there is
no token with the given ID.
```javascript
var body = myManager.revokeToken(myTokenID)
```
### Method: isTokenValid
Returns true if a token is not expired, and returns false if a token is expired
or does not exist.
```javascript
console.log(myManager.isTokenValid(myTokenID))
```