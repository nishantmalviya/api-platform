import type { ComponentProps } from "react";

export default function Editor(props: ComponentProps<"textarea">) {
  return <textarea data-testid="monaco-editor-mock" {...props} />;
}

export const loader = {
  config: () => {},
};
