const Telegraf = require('telegraf')
var
  fs = require("fs"),
  secrets = JSON.parse(fs.readFileSync('./secrets.json')),
  request = require("request"),
  semver = require("semver")

const app = new Telegraf(secrets.token || process.env.BOT_TOKEN)

app.command('start', (ctx) => {
  console.log('start', ctx.from)
  ctx.reply(`_Hey counter:_ s`, {parse_mode: 'Markdown'})
  ctx.reply('Welcome!')
})

/*
https://core.telegram.org/bots/api#markdown-style
*bold text*
_italic text_
[text](http://www.example.com/)
`inline fixed-width code`
```text
pre-formatted fixed-width code block
```
*/
app.command('latest', (ctx) => {
  request('https://coreos.com/releases/releases.json', function(error, response, body) {
    // console.log('error:', error); // Print the error if one occurred
    // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received

    var parsed = JSON.parse(body)
    var sorted_versions = Object.keys(parsed).sort( (a, b) => {
        return semver.compare(b, a)
      });
    var latest_v = sorted_versions[0]
    var latest_info = parsed[sorted_versions[0]]
    // https://coreos.com/releases/#1298.7.0
    var latest_url = 'https://coreos.com/releases/#' + latest_v
    // https://github.com/coreos/manifest/releases/tag/v1298.7.0
    var latest_gh_url = 'https://github.com/coreos/manifest/releases/tag/v' + latest_v
    var release_message = '*CoreOS latest release:* \n'
    release_message += ' ⇨ ['+ latest_v +']('+ latest_url +') ‣ [GitHub]('+ latest_gh_url +') link\n'
    release_message += ' \- date: ' + latest_info.release_date + '\n'
    release_message += ' \- kernel: ' + latest_info.major_software.kernel + '\n'
    release_message += ' \- docker: ' + latest_info.major_software.docker + '\n'
    release_message += ' \- etcd: ' + latest_info.major_software.etcd + '\n'
    release_message += ' \- fleet: ' + latest_info.major_software.fleet + '\n'
    release_message += '\n*Release notes:*\n'

    release_message += latest_info.release_notes

    ctx.reply(release_message, {parse_mode: 'Markdown'})
  });
  ctx.reply(`_...Hang on, Imma look it up..._`, {parse_mode: 'Markdown'})
})

app.hears('hi', (ctx) => ctx.reply('Hey there!'))

app.on('sticker', (ctx) => ctx.reply('👍'))

app.startPolling()
