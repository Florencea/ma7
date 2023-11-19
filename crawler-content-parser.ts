import type { FullBangumiT } from "./crawler-storage";

export class ContentParser {
  private EMPTY_BANGUMI: FullBangumiT = {
    id: -1,
    _end: true,
    title: "",
    _imgUrl: "",
    info: "",
    start: "",
    by: "",
    site: "",
    total: "",
    stat: "",
  };
  private $: cheerio.CheerioAPI;
  private items: [number, FullBangumiT][];
  constructor($: cheerio.CheerioAPI) {
    this.$ = $;
    this.items = [];
  }
  public parse(bangumiCallback: (id: number, bangumi: FullBangumiT) => void) {
    this.$("div.c.cl").each((_, el) => {
      const id = this.getId(el);
      const _end = this.getEnd(el);
      this.items.push([id, { ...this.EMPTY_BANGUMI, id, _end }]);
    });
    this.items.forEach((item) => {
      bangumiCallback(...item);
    });
  }
  private getId(el: cheerio.Element) {
    const id_link = this.$(el).children("a").attr("href");
    const id_str = `${id_link}`.split("-")[1];
    const id = parseInt(id_str, 10);
    return id;
  }
  private getEnd(el: cheerio.Element) {
    const latest_info = this.$(el).find(".ep_info").text();
    const end_str = latest_info.split(" ")[0];
    return end_str === "全";
  }
}
