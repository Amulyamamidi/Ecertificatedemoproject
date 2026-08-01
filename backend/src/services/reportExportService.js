/**
 * Utility service to generate CSV string reports from array objects.
 */
function generateCSV(data = [], fields = []) {
  if (!data || data.length === 0) {
    return fields.join(",") + "\n";
  }

  const header = fields.join(",");
  const rows = data.map((row) => {
    return fields
      .map((field) => {
        let val = row[field];
        if (val === null || val === undefined) val = "";
        val = String(val).replace(/"/g, '""');
        if (val.includes(",") || val.includes("\n") || val.includes('"')) {
          val = `"${val}"`;
        }
        return val;
      })
      .join(",");
  });

  return [header, ...rows].join("\n");
}

module.exports = {
  generateCSV
};
