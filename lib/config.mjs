import { join } from 'node:path'
import process from 'node:process'

const __dirname = process.cwd()
export const DB_DIR_PATH = join(__dirname, 'public')
export const DB_PATH = join(__dirname, 'public', 'data.json')

/**
 * @param {number} id
 */
export const VIDEO_DIR_PATH = (id) =>
  join(
    __dirname,
    'data',
    'episode',
    `${id.split('/')[0]}`,
    `${id.split('/')[1]}`,
  )
/**
 * @param {number} id
 */
export const VIDEO_PATH = (id) =>
  join(
    __dirname,
    'data',
    'episode',
    `${id.split('/')[0]}`,
    `${id.split('/')[1]}`,
    'index.json',
  )
export const DATE_FORMAT = 'YYYY-MM-DD'
export const COUNT_PER_PAGE = 20
const CONCURRENCY = 50
export const CRAWLER_CONFIG = {
  maxConnections: CONCURRENCY,
  http2: true,
  logger: {
    log: () => {},
  },
}
/**
 * @param {number} i
 */
export const ONAIR_URL_TEMPLATE = (i) =>
  `https://myself-bbs.com/forum-133-${i + 1}.html`
/**
 * @param {number} i
 */
export const ENDED_URL_TEMPLATE = (i) =>
  `https://myself-bbs.com/forum-113-${i + 1}.html`
/**
 * @param {number} id
 */
export const BANGUMI_URL_TEMPLATE = (id) =>
  `https://myself-bbs.com/thread-${id}-1-1.html`
/**
 * @param {number} id
 */
const ONAIR_URL = 'https://myself-bbs.com/forum-133-1.html'
const ENDED_URL = 'https://myself-bbs.com/forum-113-1.html'
export const INDEX_URL_LIST = [ONAIR_URL, ENDED_URL]
