export default function imgProxy({ src }) {
  return new URL(src, "https://ma7.pages.dev").toString();
}
