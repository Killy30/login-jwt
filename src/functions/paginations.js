
export function pagination(list, len) {
  const listSplit = [];
  let page = 0;
  let start = 0;
  let end = len;

  const rest = list.length % len == 0 ? 0 : 1;
  const count = Math.floor(list.length / len) + rest;

  for (let i = 1; i <= count; i++) {
    const pieceList = list.slice(start, end);

    listSplit.push(pieceList);
    start = end;
    end = start + len;
    page++;
  }

  return { listSplit, page, len: list.length };
}