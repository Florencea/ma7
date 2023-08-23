export default function imgProxy({ src, width }) {
  return new URL(`${src}?w=${width}`, "https://ma7.pages.dev").toString();
}
