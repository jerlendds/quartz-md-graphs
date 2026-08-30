export const MIN_INNER = 48;

export const widthOf = (value: string): number => [...value].length;

export const padEnd = (value: string, size: number): string => {
  const extra = size - widthOf(value);
  return extra > 0 ? value + " ".repeat(extra) : [...value].slice(0, size).join("");
};

export const padStart = (value: string, size: number): string => {
  const extra = size - widthOf(value);
  return extra > 0 ? " ".repeat(extra) + value : [...value].slice(-size).join("");
};

export const dash = (count: number): string => "-".repeat(Math.max(0, count));
export const rule = dash;

export const fillTrack = (filled: number, total: number, on = "=", off = "-"): string => {
  const count = Math.min(total, Math.max(0, filled));
  return on.repeat(count) + off.repeat(total - count);
};

export const col = (value: string, size: number, align: "left" | "right" = "left"): string =>
  align === "right" ? padStart(value, size) : padEnd(value, size);

export const colWidth = (values: string[]): number => Math.max(0, ...values.map(widthOf));

export const frameAscii = (title: string, lines: string[], minInner = MIN_INNER): string => {
  const caption = `[ ${title.trim().toUpperCase()} ]`;
  const contentWidth = Math.max(0, ...lines.map(widthOf));
  const inner = Math.max(minInner, contentWidth, caption.length + 4);
  const span = inner + 2;
  const label = ` ${caption} `;
  const leftover = Math.max(0, span - label.length);
  const left = Math.floor(leftover / 2);
  const right = leftover - left;
  const empty = `| ${" ".repeat(inner)} |`;
  return [
    `+${dash(left)}${label}${dash(right)}+`,
    empty,
    ...lines.map((line) => `| ${padEnd(line, inner)} |`),
    empty,
    `+${dash(span)}+`,
  ].join("\n");
};

export const fence = (ascii: string): string => `\`\`\`\n${ascii}\n\`\`\``;
