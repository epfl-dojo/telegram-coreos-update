/*

This script get release notes from https://coreos.com/releases/releases.json
  The main problem is that the json data doesn't contains any channel information
  so we have to use <https://{stable,beta,alpa}.release.core-os.net/amd64-usr/current/version.txt>
  to map the correct channel. Have a look to <https://github.com/epfl-dojo/telegram-coreos-update/issues/1>
  for further information.

The Telegram API is wrapped with telegraf <https://github.com/telegraf/telegraf/>
  because it allows to use the Markdown's parse_mode style, so we can layout
  message. For the records, checkout <https://core.telegram.org/bots/api#markdown-style> :
      *bold text*
      _italic text_
      [text](http://www.example.com/)
      `inline fixed-width code`
      ```text
      pre-formatted fixed-width code block
      ```
*/


const Telegraf = require('telegraf')
var
  fs = require("fs"),
  secrets = JSON.parse(fs.readFileSync('./secrets.json')),
  request = require("request"),
  semver = require("semver"),
  pp = require("properties-parser")

const app = new Telegraf(secrets.token || process.env.BOT_TOKEN)

/* Generic function to generate msg with release version info */
function releaseNotes(parsed, version, channel) {
  var latest_info = parsed[version]
  // https://coreos.com/releases/#1298.7.0
  var latest_url = 'https://coreos.com/releases/#' + version
  // https://github.com/coreos/manifest/releases/tag/v1298.7.0
  var latest_gh_url = 'https://github.com/coreos/manifest/releases/tag/v' + version
  var release_message = '*CoreOS latest '+ channel +' release:* \n'
      release_message += ' ⇨ ['+ version +']('+ latest_url +') ‣ [GitHub]('+ latest_gh_url +') link\n'
      release_message += ' \- date: ' + latest_info.release_date + '\n'
      release_message += ' \- kernel: ' + latest_info.major_software.kernel + '\n'
      release_message += ' \- docker: ' + latest_info.major_software.docker + '\n'
      release_message += ' \- etcd: ' + latest_info.major_software.etcd + '\n'
      release_message += ' \- fleet: ' + latest_info.major_software.fleet + '\n'
      release_message += '\n*Release notes:*\n'
      release_message += latest_info.release_notes
  return release_message
}

app.command('start', (ctx) => {
  console.log('start', ctx.from)
  ctx.reply(`_Hey counter:_ s`, {parse_mode: 'Markdown'})
  ctx.reply('Welcome!')
})

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

/* STABLE */
app.command('stable', (ctx) => {
  request('https://stable.release.core-os.net/amd64-usr/current/version.txt', function(error, response, body) {
    var latest_stable_version = pp.parse(body).COREOS_VERSION_ID
    request('https://coreos.com/releases/releases.json', function(error, response, body) {
      var parsed = JSON.parse(body)
      release_message = releaseNotes(parsed, latest_stable_version, 'stable')
      ctx.reply(release_message, {parse_mode: 'Markdown'})
    });
  });
  ctx.reply(`_...Hang on, Imma look up the latest stable..._`, {parse_mode: 'Markdown'})
})
/* BETA */
app.command('beta', (ctx) => {
  request('https://beta.release.core-os.net/amd64-usr/current/version.txt', function(error, response, body) {
    var latest_beta_version = pp.parse(body).COREOS_VERSION_ID
    request('https://coreos.com/releases/releases.json', function(error, response, body) {
      var parsed = JSON.parse(body)
      release_message = releaseNotes(parsed, latest_beta_version, 'ϐeta')
      ctx.reply(release_message, {parse_mode: 'Markdown'})
    });
  });
  ctx.reply(`_...Hang on, Imma look up the latest beta..._`, {parse_mode: 'Markdown'})
})
/* ALPHA */
app.command('alpha', (ctx) => {
  request('https://alpha.release.core-os.net/amd64-usr/current/version.txt', function(error, response, body) {
    var latest_alpha_version = pp.parse(body).COREOS_VERSION_ID
    request('https://coreos.com/releases/releases.json', function(error, response, body) {
      var parsed = JSON.parse(body)
      release_message = releaseNotes(parsed, latest_alpha_version, 'αlpha')
      ctx.reply(release_message, {parse_mode: 'Markdown'})
    });
  });
  ctx.reply(`_...Hang on, Imma look up the latest alpha..._`, {parse_mode: 'Markdown'})
})

app.hears('hi', (ctx) => ctx.reply('Hey there!'))

app.on('sticker', (ctx) => ctx.reply('👍'))

app.startPolling()
