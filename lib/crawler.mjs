import Crawler from 'crawler'
import dayjs from 'dayjs'
import CustomParseFormat from 'dayjs/plugin/customParseFormat.js'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import {
  BANGUMI_URL_TEMPLATE,
  COUNT_PER_PAGE,
  CRAWLER_CONFIG,
  DATE_FORMAT,
  DB_DIR_PATH,
  DB_PATH,
  ENDED_URL_TEMPLATE,
  EPISODE_ID_CURRECTION_MAP,
  INDEX_URL_LIST,
  ONAIR_URL_TEMPLATE,
  VIDEO_URL_TEMPLATE,
} from './config.mjs'
dayjs.extend(CustomParseFormat)

let GLOBAL_CURRENT_INDEX_DB_ARR = []
if (existsSync(DB_PATH)) {
  const current_index_db_json = readFileSync(DB_PATH, { encoding: 'utf-8' })
  const current_index_db = JSON.parse(current_index_db_json).data
  GLOBAL_CURRENT_INDEX_DB_ARR = current_index_db.map((bangumi) => [
    bangumi.id,
    new Set(bangumi.episodes.map((episode) => episode.id)),
  ])
} else {
  GLOBAL_CURRENT_INDEX_DB_ARR = []
}
/**
 * @type {Map<number, Set<string>}
 */
const GLOBAL_CURRENT_INDEX_DB = new Map(GLOBAL_CURRENT_INDEX_DB_ARR)
/**
 * @type {Map<number, {
 *  id: number;
 *  title: string;
 *  img_small: string;
 *  latest: number;
 *  end: number;
 *  comment: number;
 *  view: number;
 *  created: string;
 * }>}
 */
let GLOBAL_INDEX_DB = new Map()
/**
 * @type {Set<number>}
 */
let GLOBAL_INDEX_SET = new Set()
let GLOBAL_MAX_COUNT = 0

export function now() {
  const current = new Date()
  const currentStr = new Intl.DateTimeFormat('lt-LT', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(current)
  return currentStr
}

/**
 * @param {string} content
 */
export function logger(content) {
  console.log(`${now()} ${content}`)
}

/**
 * @param {Set<any>} as
 * @param {Set<any>} bs
 */
function isEqualSet(as, bs) {
  if (as.size !== bs.size) {
    return false
  }
  for (const a of as) {
    if (!bs.has(a)) {
      return false
    }
  }
  return true
}

function saveGlobalIndexDb() {
  const updated = now()
  const db_data = {
    updated,
    data: [...GLOBAL_INDEX_DB.values()],
  }
  const db_json = JSON.stringify(db_data, null, 2)
  mkdirSync(DB_DIR_PATH, { recursive: true })
  writeFileSync(DB_PATH, db_json)
  logger(`已更新番組資料 共 ${GLOBAL_INDEX_DB.size} 部番組`)
}

/**
 * @param {string} index_url
 */
function isOnAirIndex(index_url) {
  return index_url.split('-')[2] === '133'
}

/**
 * @param {string} index_url
 * @param {number} max_page
 */
function getUrlSequence(index_url, max_page) {
  return isOnAirIndex(index_url)
    ? [...Array(max_page).keys()].map((i) => ONAIR_URL_TEMPLATE(i + 1))
    : [...Array(max_page).keys()].map((i) => ENDED_URL_TEMPLATE(i + 1))
}

/**
 * @returns {string[]}
 */
function getBangumiUrlSequence() {
  return [...GLOBAL_INDEX_DB.keys()].map((id) => BANGUMI_URL_TEMPLATE(id))
}

/**
 * @param {{title: string, id: string}[]} episodes
 * @returns {string[]}
 */
function getVideoUrlSequence(episodes) {
  return episodes.map((episode) => {
    if (EPISODE_ID_CURRECTION_MAP.has(episode.id)) {
      return VIDEO_URL_TEMPLATE(EPISODE_ID_CURRECTION_MAP.get(episode.id))
    } else {
      return VIDEO_URL_TEMPLATE(episode.id)
    }
  })
}

/**
 * @param {cheerio.CheerioAPI} $
 */
function getMaxPage($) {
  const max_count_str = $('h1.xs2 > .xs1.xw0.i')
    .find('strong:last-child')
    .text()
  const max_count = parseInt(max_count_str, 10)
  GLOBAL_MAX_COUNT += max_count
  const max_page = Math.ceil(max_count / COUNT_PER_PAGE)
  return max_page
}

/**
 * @param {cheerio.CheerioAPI} $
 * @param {cheerio.Element} el
 */
function getId($, el) {
  const id_link = $(el).children('a').attr('href')
  const id_str = id_link.split('-')[1]
  const id = parseInt(id_str, 10)
  return id
}

/**
 * @param {cheerio.CheerioAPI} $
 * @param {cheerio.Element} el
 */
function getTitle($, el) {
  const title = $(el).children('a').attr('title')
  return title
}

/**
 * @param {cheerio.CheerioAPI} $
 * @param {cheerio.Element} el
 */
function getImg($, el) {
  const img_src = $(el).find('a > img').attr('src')
  const img = img_src.replaceAll('./data', 'https://cookie3.cloud/my/data')
  return img
}

/**
 * @param {cheerio.CheerioAPI} $
 * @param {cheerio.Element} el
 */
function getLatest($, el) {
  const latest_info = $(el).find('.ep_info').text()
  const latest_str = latest_info.split(' ')[1]
  const latest = parseInt(latest_str, 10)
  return latest
}

/**
 * @param {cheerio.CheerioAPI} $
 * @param {cheerio.Element} el
 */
function getEnd($, el) {
  const latest_info = $(el).find('.ep_info').text()
  const end_str = latest_info.split(' ')[0]
  return end_str === '全'
}

/**
 * @param {cheerio.CheerioAPI} $
 * @param {cheerio.Element} el
 */
function getComment($, el) {
  const comment_str = $(el).parent().find('.xi2').text()
  const comment = parseInt(comment_str, 10)
  return comment
}

/**
 * @param {cheerio.CheerioAPI} $
 * @param {cheerio.Element} el
 */
function getView($, el) {
  const view_str = $(el).parent().find('.xs0 > em').text()
  const view = parseInt(view_str, 10)
  return view
}

/**
 * @param {cheerio.CheerioAPI} $
 * @param {cheerio.Element} el
 */
function getCreated($, el) {
  const created_str = $(el).parent().find('.xs0:not(.y)').text()
  const created = dayjs(created_str, [DATE_FORMAT, 'YYYY-M-DD']).format(
    DATE_FORMAT,
  )
  return created
}

/**
 * @param {string} request_url
 */
function getBangumiId(request_url) {
  const id_str = request_url.split('-')[2]
  const id = parseInt(id_str, 10)
  return id
}

/**
 * @param {string} request_url
 */
function getVideoId(request_url) {
  const bangumi_id_str = request_url.split('/')[4]
  const video_id_str = request_url.split('/')[5]
  return `${bangumi_id_str}/${video_id_str}`
}

/**
 * @param {cheerio.CheerioAPI} $
 */
function getBangumiTitle($) {
  const title = $('title').text().split('【')[0]
  return title
}

/**
 * @param {cheerio.CheerioAPI} $
 */
function getBangumiImg($) {
  const img = $('.info_img_box.fl > img').attr('src')
  return img
}

/**
 * @param {cheerio.CheerioAPI} $
 */
function getBangumiInfo($) {
  const info = $('#info_introduction_text').text()
  return info
}

/**
 * @param {cheerio.CheerioAPI} $
 */
function getBangumiGenre($) {
  const genre_str = $('.info_info > ul > li:nth-child(1)').text().split(': ')[1]
  const genre_arr = genre_str.split('／')
  if (genre_arr.length > 1) {
    return genre_arr
  } else {
    return genre_arr[0].split(' / ')
  }
}

/**
 * @param {cheerio.CheerioAPI} $
 */
function getBangumiRoadshow($) {
  const roadshow_str = $('.info_info > ul > li:nth-child(2)')
    .text()
    .split(': ')[1]
  const roadshow = dayjs(roadshow_str, 'YYYY年MM月DD日').format(DATE_FORMAT)
  return roadshow
}

/**
 * @param {cheerio.CheerioAPI} $
 */
function getBangumiTotalEpisodes($) {
  const totalEpisodes_str = $('.info_info > ul > li:nth-child(3)')
    .text()
    .split(': ')[1]
  const totalEpisodes =
    totalEpisodes_str === '未定'
      ? -1
      : parseInt(totalEpisodes_str.split(' ')[1], 10)
  return totalEpisodes
}

/**
 * @param {cheerio.CheerioAPI} $
 */
function getBangumiOriginalAuthor($) {
  const originalAuthor_str = $('.info_info > ul > li:nth-child(4)')
    .text()
    .split(': ')[1]
  const originalAuthor_arr = originalAuthor_str.split('／')
  if (originalAuthor_arr.length > 1) {
    return originalAuthor_arr
  } else if (originalAuthor_arr[0].split(' / ')[0] !== '') {
    return originalAuthor_arr[0].split(' / ')
  } else {
    return []
  }
}

/**
 * @param {cheerio.CheerioAPI} $
 */
function getBangumiSite($) {
  const site = $('.info_info > ul > li:nth-child(5) > a').attr('href')
  return site
}

/**
 * @param {string} idStr
 */
function isValidVideo(idStr) {
  return idStr.split('/player/play/')[0] === 'https://v.myself-bbs.com'
}

/**
 * @param {cheerio.CheerioAPI} $
 */
function getBangumiEpisodes($) {
  const episodes_arr = $('.main_list li:has(ul)')
    .map((_, el) => {
      const idStr = $(el).find('a[data-href*=myself]').attr('data-href') || ''
      if (isValidVideo(idStr)) {
        const title = $(el).find('li > a[href="javascript:;"]').text()
        const id = idStr
          .split('https://v.myself-bbs.com/player/play/')[1]
          .trimEnd()
        return { title, id }
      } else {
        return { title: '', id: 'invalid' }
      }
    })
    .get()
    .filter((episode) => episode.id !== 'invalid')
  return episodes_arr
}

// const VideoCrawler = new Crawler({
//   ...CRAWLER_CONFIG,
//   jQuery: false,
//   callback: (error, { request, body }, done) => {
//     if (error) {
//       if (error.message.includes('0 retries left')) {
//         logger(error.message)
//       }
//     } else {
//       try {
//         const id = getVideoId(request.uri)
//         const raw_video_data = JSON.parse(body)
//         const video_quility = raw_video_data.video['720p']
//         const video_arr = raw_video_data.host
//         const data = video_arr
//           .map((v) => ({
//             server: v.host.split('.')[0].split('https://')[1],
//             url: `${v.host}${video_quility}`,
//             weight: v.weight,
//           }))
//           .sort((a, b) => b.weight - a.weight)
//         const updated = now()
//         const video_data = { updated, data }
//         const video_json = JSON.stringify(video_data)
//         mkdirSync(VIDEO_DIR_PATH(id), { recursive: true })
//         writeFileSync(VIDEO_PATH(id), video_json)
//       } catch (e) {
//         logger(`Error fetch ${request.uri}`)
//       }
//     }
//     done()
//   },
// })

const BangumiCrawler = new Crawler({
  ...CRAWLER_CONFIG,
  callback: (error, { request, $ }, done) => {
    if (error) {
      if (error.message.includes('0 retries left')) {
        logger(error.message)
      }
    } else {
      const id = getBangumiId(request.uri)
      const title = getBangumiTitle($)
      const img = getBangumiImg($)
      const info = getBangumiInfo($)
      const genre = getBangumiGenre($)
      const roadshow = getBangumiRoadshow($)
      const totalEpisodes = getBangumiTotalEpisodes($)
      const originalAuthor = getBangumiOriginalAuthor($)
      const site = getBangumiSite($)
      const episodes = getBangumiEpisodes($)
      const updated = now()
      const bangumi_index_data = GLOBAL_INDEX_DB.get(id)
      const bangumi_data = {
        ...bangumi_index_data,
        img,
        info,
        genre,
        roadshow,
        totalEpisodes,
        originalAuthor,
        site,
        episodes,
        updated,
      }
      let hasUpdate = false
      if (GLOBAL_CURRENT_INDEX_DB.has(id)) {
        const current_episodes = GLOBAL_CURRENT_INDEX_DB.get(id)
        const new_episodes = new Set(episodes.map((episode) => episode.id))
        if (!isEqualSet(current_episodes, new_episodes)) {
          hasUpdate = true
          const video_url_sequence = getVideoUrlSequence(episodes)
          // VideoCrawler.queue(video_url_sequence)
          logger(`更新 ${id} ${title}`)
        }
      } else {
        hasUpdate = true
        const video_url_sequence = getVideoUrlSequence(episodes)
        // VideoCrawler.queue(video_url_sequence)
        logger(`更新 ${id} ${title}`)
      }
      bangumi_data.hasUpdate = hasUpdate
      GLOBAL_INDEX_DB.set(id, bangumi_data)
      GLOBAL_INDEX_SET.add(id)
      if (GLOBAL_INDEX_DB.size === GLOBAL_INDEX_SET.size) {
        saveGlobalIndexDb()
      }
    }
    done()
  },
})

const ContentCrawler = new Crawler({
  ...CRAWLER_CONFIG,
  callback: (error, { $ }, done) => {
    if (error) {
      if (error.message.includes('0 retries left')) {
        logger(error.message)
      }
    } else {
      $('div.c.cl').each((_, el) => {
        const id = getId($, el)
        const title = getTitle($, el)
        const img_small = getImg($, el)
        const latest = getLatest($, el)
        const end = getEnd($, el)
        const comment = getComment($, el)
        const view = getView($, el)
        const created = getCreated($, el)
        GLOBAL_INDEX_DB.set(id, {
          id,
          title,
          img_small,
          latest,
          end,
          comment,
          view,
          created,
        })
      })
      if (GLOBAL_INDEX_DB.size === GLOBAL_MAX_COUNT) {
        const bangumi_url_sequence = getBangumiUrlSequence()
        BangumiCrawler.queue(bangumi_url_sequence)
      }
    }
    done()
  },
})

const IndexCrawler = new Crawler({
  ...CRAWLER_CONFIG,
  callback: (error, res, done) => {
    if (error) {
      if (error.message.includes('0 retries left')) {
        logger(error.message)
      }
    } else {
      const $ = res.$
      const max_page = getMaxPage($)
      const url_sequence = getUrlSequence(res.request.uri, max_page)
      ContentCrawler.queue(url_sequence)
    }
    done()
  },
})

/**
 * @param {string[]} index_url_arr
 */
export default function crawler() {
  logger('更新番組資料')
  IndexCrawler.queue(INDEX_URL_LIST)
}

crawler()
