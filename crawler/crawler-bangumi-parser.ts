import type { Request } from "crawlee";
import dayjs from "dayjs";
import CustomParseFormat from "dayjs/plugin/customParseFormat.js";
import type { FullBangumiT } from "./crawler-storage";
dayjs.extend(CustomParseFormat);

export class BangumiParser {
  private id: number;
  private _end: boolean;
  private title: string;
  private _imgUrl: string;
  private info: string;
  private start: string;
  private _totalEpisodes: number;
  private by: string;
  private site: string;
  private _episodes: { title: string }[];
  private total: string;
  private stat: string;
  private $: cheerio.CheerioAPI;
  private DATE_FORMAT = "YYYY-MM-DD";
  private START_CORRECTION_MAP = new Map([
    [50032, "2023-10-07"],
    [42650, "2013-01-02"],
    [44473, "2014-09-28"],
    [44620, "2014-08-22"],
    [44819, "2013-04-28"],
    [45311, "2019-05-24"],
    [47141, "2021-02-25"],
    [48332, "2022-07-07"],
    [49522, "2023-04-09"],
    [44864, "2006-04-06"],
    [44871, "2014-07-07"],
  ]);
  constructor(
    request: Request,
    $: cheerio.CheerioAPI,
    DB: Map<number, FullBangumiT>,
  ) {
    this.$ = $;
    this.id = this.getId(request.url);
    const bangumi_index_data = DB.get(this.id);
    this._end = bangumi_index_data?._end ?? true;
    this.title = this.getTitle();
    this._imgUrl = this.getImg();
    this.info = this.getInfo();
    this.start = this.getStart();
    this._totalEpisodes = this.getTotalEpisodes();
    this.by = this.getBy();
    this.site = this.getSite();
    this._episodes = this.getEpisodes();
    this.total = this.getTotal();
    this.stat = this.getStat();
  }
  public parse(bangumiCallback: (id: number, bangumi: FullBangumiT) => void) {
    const { id, _end, title, _imgUrl, info, start, by, site, total, stat } =
      this;
    bangumiCallback(id, {
      id,
      _end,
      title,
      _imgUrl,
      info,
      start,
      by,
      site,
      total,
      stat,
    });
  }
  private getId(request_url: string) {
    const id_str = request_url.split("-")[2];
    return parseInt(id_str, 10);
  }
  private getTitle() {
    return this.$("title").text().split("【")[0];
  }
  private getImg() {
    return this.$(".info_img_box.fl > img").attr("src") ?? "";
  }
  private getInfo() {
    return this.$("#info_introduction_text").text();
  }
  private getStart() {
    if (this.START_CORRECTION_MAP.has(this.id)) {
      return `${this.START_CORRECTION_MAP.get(this.id)}`;
    } else {
      const start_str = this.$(".info_info > ul > li:nth-child(2)")
        .text()
        .split(": ")[1];
      const startDayjs = dayjs(start_str, "YYYY年MM月DD日");
      if (startDayjs.isValid()) {
        return startDayjs.format(this.DATE_FORMAT);
      } else {
        return "未知";
      }
    }
  }
  private getTotalEpisodes() {
    const totalEpisodes_str = this.$(".info_info > ul > li:nth-child(3)")
      .text()
      .split(": ")[1];
    return totalEpisodes_str === "未定"
      ? -1
      : parseInt(totalEpisodes_str.split(" ")[1], 10);
  }
  private getBy() {
    const by_str = this.$(".info_info > ul > li:nth-child(4)")
      .text()
      .split(": ")[1];
    const by_arr = by_str.split("／");
    if (by_arr.length > 1) {
      return `${by_arr.join("/")}`;
    } else if (by_arr[0].split(" / ")[0] !== "") {
      return `${by_arr[0].split(" / ").join("/")}`;
    } else {
      return "";
    }
  }
  private getSite() {
    return this.$(".info_info > ul > li:nth-child(5) > a").attr("href") ?? "";
  }
  private getEpisodes() {
    return this.$(".main_list li:has(ul)")
      .map((_, el) => {
        const videoIdStr =
          this.$(el).find("a[data-href*=myself]").attr("data-href") ?? "";
        if (this.checkIsValidVideo(videoIdStr)) {
          const title = this.$(el).find('li > a[href="javascript:;"]').text();
          return { title };
        } else {
          return { title: "" };
        }
      })
      .get() as { title: string }[];
  }
  private getTotal() {
    return this._end
      ? ""
      : `${
          this._totalEpisodes < 0
            ? "(總集數未定)"
            : `(共 ${this._totalEpisodes} 話)`
        }`;
  }
  private getStat() {
    return this._end
      ? "已完結"
      : `連載至 ${this._episodes.at(-1)?.title ?? ""}`;
  }
  private checkIsValidVideo(videoIdStr: string) {
    return videoIdStr.split("/player/")[0] === "https://v.myself-bbs.com";
  }
}
