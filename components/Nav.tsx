import type { DetailedHTMLProps, HTMLAttributes } from "react";

export const Nav = (
  props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>,
) => {
  return (
    <nav
      className="flex w-full items-center justify-center gap-2 bg-white p-2 dark:bg-black"
      {...props}
    />
  );
};
