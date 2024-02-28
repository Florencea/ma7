import type { DetailedHTMLProps, InputHTMLAttributes } from "react";

export const KeywordSearch = (
  props: DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >,
) => {
  return (
    <input
      className="w-[200px] border border-gray-400 bg-transparent p-2 leading-none outline-none"
      type="text"
      placeholder="TITLE / AUTHOR / INFO"
      {...props}
    />
  );
};
