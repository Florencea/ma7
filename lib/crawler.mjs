import Crawler from "crawler";
import dayjs from "dayjs";
import CustomParseFormat from "dayjs/plugin/customParseFormat.js";
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import {
  BANGUMI_URL_TEMPLATE,
  COUNT_PER_PAGE,
  CRAWLER_CONFIG,
  DATE_FORMAT,
  DB_DIR_PATH,
  DB_PATH,
  ENDED_URL_TEMPLATE,
  INDEX_URL_LIST,
  ONAIR_URL_TEMPLATE,
} from "./config.mjs";
dayjs.extend(CustomParseFormat);

mkdirSync("public/img", { recursive: true });

let GLOBAL_CURRENT_INDEX_DB_ARR = [];

/**
 * @type {Map<number, Set<string>}
 */
const GLOBAL_CURRENT_INDEX_DB = new Map(GLOBAL_CURRENT_INDEX_DB_ARR);
/**
 * @type {Map<number, {
 *  id: number;
 *  title: string;
 *  latest: number;
 *  end: number;
 * }>}
 */
let GLOBAL_INDEX_DB = new Map();
/**
 * @type {Set<number>}
 */
let GLOBAL_INDEX_SET = new Set();
let GLOBAL_MAX_COUNT = 0;

export function now() {
  const current = new Date();
  const currentStr = new Intl.DateTimeFormat("lt-LT", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(current);
  return currentStr;
}

/**
 * @param {string} content
 */
export function logger(content) {
  console.info(`${now()} ${content}`);
}

/**
 * @param {Set<any>} as
 * @param {Set<any>} bs
 */
function isEqualSet(as, bs) {
  if (as.size !== bs.size) {
    return false;
  }
  for (const a of as) {
    if (!bs.has(a)) {
      return false;
    }
  }
  return true;
}

function saveGlobalIndexDb() {
  const updated = now();
  const db_data = {
    updated,
    data: [...GLOBAL_INDEX_DB.values()],
  };
  const db_json = JSON.stringify(db_data, null, 2);
  mkdirSync(DB_DIR_PATH, { recursive: true });
  writeFileSync(DB_PATH, db_json);
  logger(`Complete fetch ${GLOBAL_INDEX_DB.size} Bangumis.`);
}

/**
 * @param {string} index_url
 */
function isOnAirIndex(index_url) {
  return index_url.split("-")[2] === "133";
}

/**
 * @param {string} index_url
 * @param {number} max_page
 */
function getUrlSequence(index_url, max_page) {
  return isOnAirIndex(index_url)
    ? [...Array(max_page).keys()].map((i) => ONAIR_URL_TEMPLATE(i + 1))
    : [...Array(max_page).keys()].map((i) => ENDED_URL_TEMPLATE(i + 1));
}

/**
 * @returns {string[]}
 */
function getBangumiUrlSequence() {
  return [...GLOBAL_INDEX_DB.keys()].map((id) => BANGUMI_URL_TEMPLATE(id));
}

/**
 * @param {cheerio.CheerioAPI} $
 */
function getMaxPage($) {
  const max_count_str = $("h1.xs2 > .xs1.xw0.i")
    .find("strong:last-child")
    .text();
  const max_count = parseInt(max_count_str, 10);
  GLOBAL_MAX_COUNT += max_count;
  const max_page = Math.ceil(max_count / COUNT_PER_PAGE);
  return max_page;
}

/**
 * @param {cheerio.CheerioAPI} $
 * @param {cheerio.Element} el
 */
function getId($, el) {
  const id_link = $(el).children("a").attr("href");
  const id_str = id_link.split("-")[1];
  const id = parseInt(id_str, 10);
  return id;
}

/**
 * @param {cheerio.CheerioAPI} $
 * @param {cheerio.Element} el
 */
function getTitle($, el) {
  const title = $(el).children("a").attr("title");
  return title;
}

/**
 * @param {cheerio.CheerioAPI} $
 * @param {cheerio.Element} el
 */
function getLatest($, el) {
  const latest_info = $(el).find(".ep_info").text();
  const latest_str = latest_info.split(" ")[1];
  const latest = parseInt(latest_str, 10);
  return latest;
}

/**
 * @param {cheerio.CheerioAPI} $
 * @param {cheerio.Element} el
 */
function getEnd($, el) {
  const latest_info = $(el).find(".ep_info").text();
  const end_str = latest_info.split(" ")[0];
  return end_str === "全";
}

/**
 * @param {string} request_url
 */
function getBangumiId(request_url) {
  const id_str = request_url.split("-")[2];
  const id = parseInt(id_str, 10);
  return id;
}

/**
 * @param {cheerio.CheerioAPI} $
 */
function getBangumiTitle($) {
  const title = $("title").text().split("【")[0];
  return title;
}

/**
 * @param {cheerio.CheerioAPI} $
 */
function getBangumiImg($) {
  const img = $(".info_img_box.fl > img").attr("src");
  return img;
}

/**
 * @param {cheerio.CheerioAPI} $
 */
function getBangumiInfo($) {
  const info = $("#info_introduction_text").text();
  return info;
}

/**
 * @param {cheerio.CheerioAPI} $
 */
function getBangumiRoadshow($) {
  const roadshow_str = $(".info_info > ul > li:nth-child(2)")
    .text()
    .split(": ")[1];
  const roadshow = dayjs(roadshow_str, "YYYY年MM月DD日").format(DATE_FORMAT);
  return roadshow;
}

/**
 * @param {cheerio.CheerioAPI} $
 */
function getBangumiTotalEpisodes($) {
  const totalEpisodes_str = $(".info_info > ul > li:nth-child(3)")
    .text()
    .split(": ")[1];
  const totalEpisodes =
    totalEpisodes_str === "未定"
      ? -1
      : parseInt(totalEpisodes_str.split(" ")[1], 10);
  return totalEpisodes;
}

/**
 * @param {cheerio.CheerioAPI} $
 */
function getBangumiOriginalAuthor($) {
  const originalAuthor_str = $(".info_info > ul > li:nth-child(4)")
    .text()
    .split(": ")[1];
  const originalAuthor_arr = originalAuthor_str.split("／");
  if (originalAuthor_arr.length > 1) {
    return originalAuthor_arr;
  } else if (originalAuthor_arr[0].split(" / ")[0] !== "") {
    return originalAuthor_arr[0].split(" / ");
  } else {
    return [];
  }
}

/**
 * @param {cheerio.CheerioAPI} $
 */
function getBangumiSite($) {
  const site = $(".info_info > ul > li:nth-child(5) > a").attr("href");
  return site;
}

/**
 * @param {string} idStr
 */
function isValidVideo(idStr) {
  return idStr.split("/player/")[0] === "https://v.myself-bbs.com";
}

/**
 * @param {cheerio.CheerioAPI} $
 */
function getBangumiEpisodes($) {
  const episodes_arr = $(".main_list li:has(ul)")
    .map((_, el) => {
      const idStr = $(el).find("a[data-href*=myself]").attr("data-href") || "";
      if (isValidVideo(idStr)) {
        const title = $(el).find('li > a[href="javascript:;"]').text();
        return { title };
      } else {
        return { title: "" };
      }
    })
    .get();
  return episodes_arr;
}

const BangumiCrawler = new Crawler({
  ...CRAWLER_CONFIG,
  callback: async (error, { request, $ }, done) => {
    if (error) {
      if (error.message.includes("0 retries left")) {
        logger(error.message);
      }
    } else {
      const id = getBangumiId(request.uri);
      const title = getBangumiTitle($);
      const img = getBangumiImg($);
      const info = getBangumiInfo($);
      const roadshow = getBangumiRoadshow($);
      const totalEpisodes = getBangumiTotalEpisodes($);
      const originalAuthor = getBangumiOriginalAuthor($);
      const site = getBangumiSite($);
      const episodes = getBangumiEpisodes($);
      const updated = now();
      const bangumi_index_data = GLOBAL_INDEX_DB.get(id);
      const bangumi_data = {
        ...bangumi_index_data,
        img,
        info,
        roadshow,
        totalEpisodes,
        originalAuthor,
        site,
        episodes,
        updated,
      };
      const res = await fetch(img);
      const imgData = await res.blob();
      sharp(imgData)
        .toFormat("avif")
        .toFile(`public/img/${img.split("/").pop()}.avif`);
      GLOBAL_INDEX_DB.set(id, bangumi_data);
      GLOBAL_INDEX_SET.add(id);
      logger(
        `[${GLOBAL_INDEX_SET.size}/${GLOBAL_INDEX_DB.size}] Fetch ${id} ${title}`,
      );
      if (GLOBAL_INDEX_DB.size === GLOBAL_INDEX_SET.size) {
        saveGlobalIndexDb();
      }
    }
    done();
  },
});

const ContentCrawler = new Crawler({
  ...CRAWLER_CONFIG,
  callback: (error, { $ }, done) => {
    if (error) {
      if (error.message.includes("0 retries left")) {
        logger(error.message);
      }
    } else {
      $("div.c.cl").each((_, el) => {
        const id = getId($, el);
        const title = getTitle($, el);
        const latest = getLatest($, el);
        const end = getEnd($, el);
        GLOBAL_INDEX_DB.set(id, {
          id,
          title,
          latest,
          end,
        });
      });
      if (GLOBAL_INDEX_DB.size === GLOBAL_MAX_COUNT) {
        const bangumi_url_sequence = getBangumiUrlSequence();
        BangumiCrawler.queue(bangumi_url_sequence);
      }
    }
    done();
  },
});

const IndexCrawler = new Crawler({
  ...CRAWLER_CONFIG,
  callback: (error, res, done) => {
    if (error) {
      if (error.message.includes("0 retries left")) {
        logger(error.message);
      }
    } else {
      const $ = res.$;
      const max_page = getMaxPage($);
      const url_sequence = getUrlSequence(res.request.uri, max_page);
      ContentCrawler.queue(url_sequence);
    }
    done();
  },
});

/**
 * @param {string[]} index_url_arr
 */
export default function crawler() {
  logger("Fetching bangumis...");
  IndexCrawler.queue(INDEX_URL_LIST);
}

crawler();
