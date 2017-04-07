var TelegramBot = require('node-telegram-bot-api');
var fs = require("fs"),
    secrets = JSON.parse(fs.readFileSync('./secrets.json')),
    request = require("request"),
    semver = require("semver");

// replace the value below with the Telegram token you receive from @BotFather
var token = secrets.token;

// Create a bot that uses 'polling' to fetch new updates
var bot = new TelegramBot(token, {
    polling: true
});

bot.onText(/\/latest/, function(msg, match) {
    var coreosRelease = request('https://coreos.com/releases/releases.json', function(error, response, body) {
        console.log('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received

        var parsed = JSON.parse(body);

        var sorted_versions = Object.keys(parsed).sort(
            function(a, b) {
                return semver.compare(b, a);
            }
        );
        bot.sendMessage(msg.chat.id, JSON.stringify(parsed[sorted_versions[0]]));
    });
    bot.sendMessage(msg.chat.id, "Hang on, Imma look it up");
});

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, function(msg, match) {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    console.log("received /echo");
    var chatId = msg.chat.id;
    var resp = match[1]; // the captured "whatever"

    // send back the matched "whatever" to the chat
    bot.sendMessage(chatId, resp);
});
