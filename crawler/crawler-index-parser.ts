import type { Request } from "crawlee";

export class IndexParser {
  private urls: string[];
  private isOnAirIndex: boolean;
  private pageSequence: number[];
  private COUNT_PER_PAGE = 20;
  constructor(request: Request, $: cheerio.CheerioAPI) {
    this.urls = [];
    this.isOnAirIndex = this.checkIsOnAirIndex(request);
    this.pageSequence = this.toSequence(this.getMaxPage($));
  }
  public parse(urlCallback: (url: string) => void) {
    if (this.isOnAirIndex) {
      this.generateOnAirUrls();
    } else {
      this.generateEndedUrls();
    }
    this.urls.forEach(urlCallback);
  }
  private checkIsOnAirIndex(request: Request) {
    return request.url.split("-")[2] === "133";
  }
  private getMaxPage($: cheerio.CheerioAPI) {
    const max_count_str = $("h1.xs2 > .xs1.xw0.i")
      .find("strong:last-child")
      .text();
    const max_count = parseInt(max_count_str, 10);
    const max_page = Math.ceil(max_count / this.COUNT_PER_PAGE);
    return max_page;
  }
  private generateOnAirUrls = () => {
    this.urls = this.pageSequence.map(this.toOnAirUrl);
  };
  private generateEndedUrls = () => {
    this.urls = this.pageSequence.map(this.toEndedUrl);
  };
  private toSequence = (len: number) => [...Array(len).keys()];
  private toOnAirUrl = (i: number) =>
    `https://myself-bbs.com/forum-133-${i + 2}.html`;
  private toEndedUrl = (i: number) =>
    `https://myself-bbs.com/forum-113-${i + 2}.html`;
}
