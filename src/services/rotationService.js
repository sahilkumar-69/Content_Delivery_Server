export const pickActiveContent = (rows, now = new Date()) => {
  if (!rows || rows.length === 0) {
    return null;
  }

  const totalDuration = rows.reduce(
    (sum, row) => sum + Number(row.duration_seconds || 0),
    0,
  );
  if (totalDuration <= 0) {
    return rows[0];
  }

  const seconds = Math.floor(now.getTime() / 1000);
  const offset = seconds % totalDuration;

  let cursor = 0;
  for (const row of rows) {
    cursor += Number(row.duration_seconds);
    if (offset < cursor) {
      return row;
    }
  }

  return rows[rows.length - 1];
};
