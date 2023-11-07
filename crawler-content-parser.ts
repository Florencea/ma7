import { BasicBangumiT } from "./crawler-config";

export class ContentParser {
  private $: cheerio.CheerioAPI;
  private items: BasicBangumiT[];
  constructor($: cheerio.CheerioAPI) {
    this.$ = $;
    this.items = [];
  }
  public parse(itemCallback: (item: BasicBangumiT) => void) {
    this.$("div.c.cl").each((_, el) => {
      const id = this.getId(el);
      const end = this.getEnd(el);
      this.items.push({ id, end });
    });
    this.items.forEach(itemCallback);
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
