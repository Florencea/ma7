import Crawler from 'crawler'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import sharp from 'sharp'
import { CRAWLER_CONFIG, DB_PATH } from './config.mjs'

/**
 * @type {number}
 */
let COMPLETE_CNT = 0

/**
 * @type {Array<string>}
 */
let GLOBAL_CURRENT_IMG_DB_ARR = []

if (existsSync(DB_PATH)) {
  const current_index_db_json = readFileSync(DB_PATH, { encoding: 'utf-8' })
  const current_index_db = JSON.parse(current_index_db_json).data
  GLOBAL_CURRENT_IMG_DB_ARR = current_index_db.map((bangumi) => bangumi.img)
}

mkdirSync('public/img', { recursive: true })

function now() {
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
  console.info(`${now()} ${content}`)
}

const IndexCrawler = new Crawler({
  ...CRAWLER_CONFIG,
  encoding: null,
  jQuery: false,
  callback: (error, { request, body }, done) => {
    if (error) {
      if (error.message.includes('0 retries left')) {
        logger(error.message)
      }
    } else {
      sharp(body)
        .toFormat('avif')
        .toFile(`public/img/${request.uri.split('/').pop()}.avif`, () => {
          COMPLETE_CNT += 1
          if (COMPLETE_CNT === GLOBAL_CURRENT_IMG_DB_ARR.length) {
            logger(
              `已儲存 ${COMPLETE_CNT}/${GLOBAL_CURRENT_IMG_DB_ARR.length} 張圖片`,
            )
          }
        })
    }
    done()
  },
})

/**
 * @param {string[]} GLOBAL_CURRENT_IMG_DB_ARR
 */
function crawler() {
  logger('抓取圖片資料')
  IndexCrawler.queue(GLOBAL_CURRENT_IMG_DB_ARR)
}

crawler()
