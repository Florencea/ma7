import { clsx } from "clsx";
import type { DetailedHTMLProps, InputHTMLAttributes } from "react";

export const CountBox = ({
  disabled,
  ...props
}: DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>) => {
  return (
    <input
      className={clsx(
        "pointer-events-none w-[50px] cursor-default select-none appearance-none bg-transparent p-2 text-right leading-none",
        { "text-gray-400": disabled },
      )}
      tabIndex={-1}
      readOnly
      aria-readonly
      {...props}
    />
  );
};
