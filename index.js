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
const Extra = Telegraf.Extra
const Markup = Telegraf.Markup

var
  fs = require("fs"),
  request = require("request"),
  semver = require("semver"),
  pp = require("properties-parser"),
  token = ''

if (fs.existsSync('./secrets.json')) {
  // In case you want to add a secrets.json file with
  // {
  //   "token": "123456789:ABCDEFGHIJKLMNOPKRSTUVWXYZ123456789"
  // }
  // in it.
  var secrets = JSON.parse(fs.readFileSync('./secrets.json'))
  token = secrets.token
} else {
  // This is probably a best way to do it, use a environemnt var when starting
  // the container, e.g.:
  // docker run -p 1337:8080 -e BOT_TOKEN=123456789:ABCDEFGHIJKLMNOPKRSTUVWXYZ123456789 epfldojo/telegram-coreos-update
  token = process.env.BOT_TOKEN
}
// be sure to have a least one tocken...
if (token == '') {
  console.error("Be sure to specify the BOT TOKEN !!!")
  process.exit(1);
}
const app = new Telegraf(token)

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

/* LATEST : show a quick menu offering `stable`, `beta` and `alpha` */
app.command('latest', (ctx) => {
  return ctx.reply('One time keyboard', Markup
    .keyboard([
      '/stable',
      '/alpha',
      '/beta'
    ])
    .oneTime()
    .resize()
    .extra()
  )
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

app.startPolling()
