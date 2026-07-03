export function primaryAndForeignKeyNames(rows) {
  return rows
    .filter((row) => row.type === "p" || row.type === "f")
    .map((row) => row.name)
    .sort();
}
