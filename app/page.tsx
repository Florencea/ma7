import { readFile } from "node:fs/promises";
import { Main, type BangumiT } from "./main";

const Page = async () => {
  let data: BangumiT[] = [];
  if (process.env.NODE_ENV === "production") {
    const text = await readFile("public/data.json", { encoding: "utf-8" });
    data = JSON.parse(text);
  } else {
    const res = await fetch("https://ma7.pages.dev/data.json");
    data = await res.json();
  }
  return (
    <>
      <link
        rel="preload"
        fetchPriority="high"
        as="image"
        href={`/img/${data?.[0].id}.avif`}
        type="image/avif"
      />
      <Main rawData={data} />
    </>
  );
};

export default Page;
