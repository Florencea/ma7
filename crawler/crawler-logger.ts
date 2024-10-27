export class Logger {
  private now() {
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
  public info(content: string) {
    console.info(`${this.now()} ${content}`);
  }
  public error(content: string) {
    console.error(`${this.now()} ERROR: ${content}`);
  }
}
