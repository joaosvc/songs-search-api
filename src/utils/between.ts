export const between = (
  haystack: string,
  left: string | RegExp,
  right: string
): string => {
  let pos: number;

  if (left instanceof RegExp) {
    const match = haystack.match(left);
    if (!match || match.index === undefined) {
      return "";
    }
    pos = match.index + match[0].length;
  } else {
    pos = haystack.indexOf(left);
    if (pos === -1) {
      return "";
    }
    pos += left.length;
  }

  haystack = haystack.slice(pos);
  pos = haystack.indexOf(right);

  if (pos === -1) {
    return "";
  }

  haystack = haystack.slice(0, pos);
  return haystack;
};
