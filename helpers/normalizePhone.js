// Converts Nigerian numbers to +234 format, e.g. "0801 234 5678" -> "+2348012345678".
// Other international numbers ("+44...") are returned with spaces/dashes stripped.
const normalizePhone = (phone) => {
  if (!phone) return phone;
  const cleaned = String(phone).replace(/[\s\-()]/g, "");

  if (/^0[7-9][01][0-9]{8}$/.test(cleaned)) return `+234${cleaned.slice(1)}`;
  if (/^234[7-9][01][0-9]{8}$/.test(cleaned)) return `+${cleaned}`;
  return cleaned;
};

module.exports = normalizePhone;
