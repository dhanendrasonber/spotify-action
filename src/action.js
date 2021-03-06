const core = require('@actions/core');
const log = require('loglevel')
const fs = require('fs')

let getEventData = function () {
  return JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'))
}

// // Set default log level or read the environment setting
log.setLevel(process.env.LOG_LEVEL || 'debug')

// Print out the event data
log.trace(`Event data: ${JSON.stringify(getEventData())}`)

const request = require('request')

class SpotifyAction {
  constructor ({ token }) {
    this.endpoints = {
      api_uri: 'https://api.spotify.com/v1',
      searchSong: '/search',
      playSong: '/me/player/play'
    }

    this.token = token
    this.device_id = device_id;
  }

  get headers () {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }

  getEndpoint (method) {
    return `${this.endpoints.api_uri}${this.endpoints[method]}`
  }

  searchSong (query) {
    if (!query) {
      throw new Error('invalid search query')
    }

    return new Promise((resolve, reject) => {
      const options = {
        url: `${this.getEndpoint('searchSong')}?q=${query}%20&type=track&limit=1`,
        method: 'GET',
        headers: this.headers
      }

      request(options, (err, res, body) => {
        if (err) {
          reject(new Error(`search request error: ${err}`))
        }

        var headers = res.headers
        var statusCode = res.statusCode
        log.debug(`---- debug play request ----`)
        log.debug('headers', headers)
        log.debug('statusCode', statusCode)
        log.debug('body', body)
        log.debug(`---- end debug play request ----`)

        const song = JSON.parse(body).tracks.items[0].uri

        log.info(`found ${song}`)
        resolve(song)
      })
    })
  }

  playSong (song, device_id) {
    if (!song) {
      throw new Error('invalid song')
    }

    return new Promise((resolve, reject) => {
      const options = {
        url: `${this.getEndpoint('playSong')}?device_id=${device_id}`,
        method: 'PUT',
        headers: this.headers,
        json: {
          'uris': [song]
        }
      }

      request(options, (err, res, body) => {
        if (err) {
          reject(new Error(`play request error: ${err}`))
        }

        var headers = res.headers
        var statusCode = res.statusCode
        log.debug(`---- debug play request ----`)
        log.debug('headers', headers)
        log.debug('statusCode', statusCode)
        log.debug('body', body)
        log.debug(`---- end debug play request ----`)

        log.info(`Playing ${song}`)
        resolve()
      })
    })
  }
};

const token = core.getInput('token');
const search = core.getInput('song');
const device_id = core.getInput('device_id');

const Spotify = new SpotifyAction({ token })

Spotify.searchSong(search).then(song => Spotify.playSong(song, device_id))
