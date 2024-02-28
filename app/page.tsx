import { readFile } from "fs/promises";
import { Main, type BangumiT } from "./main";

export default async function Page() {
  const text = await readFile("public/data.json", { encoding: "utf-8" });
  const data: BangumiT[] = JSON.parse(text);
  return (
    <>
      <link
        rel="preload"
        fetchPriority="high"
        as="image"
        href={`/img/${data?.[0].id}.avif`}
        type="image/avif"
      />
      <Main fallbackData={data} />
    </>
  );
}
