// Transform the maintained availability scripts without changing inventory
// IDs, capacity accounting, reservation overlap, or appointment status rules.
function replaceRequired(script, before, after, nodeId) {
  if (!script.includes(before)) {
    throw new Error(`Availability node ${nodeId} is missing its occupancy calculation`);
  }
  return script.replace(before, after);
}

export function indexAppointmentAvailability(node) {
  let script = String(node.data.script || "");
  if (script.includes("const appointmentCountsByDoctorAndStart = new Map();")) return;

  const index = String.raw`
const occupancyKey = (doctorId, value) => JSON.stringify([String(doctorId || ""), value]);
const reservationWindowsByDoctorAndDate = new Map();
for (const reservation of reservations) {
  const key = occupancyKey(reservation.doctor_id, String(reservation.appointment_date || ""));
  const windows = reservationWindowsByDoctorAndDate.get(key) || [];
  windows.push({
    start: toMinutes(reservation.start_time || reservation.start || ""),
    end: toMinutes(reservation.end_time || reservation.end || "")
  });
  reservationWindowsByDoctorAndDate.set(key, windows);
}
const appointmentCountsByDoctorAndStart = new Map();
const occupiedStatuses = new Set(["pending_payment", "booked", "confirmed", "checked_in", "called"]);
for (const appointment of appointments) {
  if (!occupiedStatuses.has(String(appointment.status || "").toLowerCase())) continue;
  const start = appointment.scheduled_start_at
    ? Date.parse(String(appointment.scheduled_start_at))
    : Date.parse(String(appointment.appointment_date || "") + "T" + String(appointment.appointment_time || "") + ":00+05:30");
  if (!Number.isFinite(start)) continue;
  const key = occupancyKey(appointment.doctor_id, start);
  appointmentCountsByDoctorAndStart.set(key, (appointmentCountsByDoctorAndStart.get(key) || 0) + 1);
}
const blockedByDate = new Map();
for (const exception of blocked) {
  const date = String(exception.exception_date || "");
  const rows = blockedByDate.get(date) || [];
  rows.push(exception);
  blockedByDate.set(date, rows);
}
`;
  script = replaceRequired(script, "const unique = new Map();", `${index}\nconst unique = new Map();`, node.id);
  script = replaceRequired(script, "const blockedHere = blocked.some((item) => {", "const blockedHere = (blockedByDate.get(slot.date) || []).some((item) => {", node.id);
  const occupancyStart = script.indexOf("  const activeCount = reservations.filter((reservation) =>");
  const occupancyEnd = script.indexOf("  const isBooked = activeCount + bookedCount >= slot.capacity;", occupancyStart);
  if (occupancyStart < 0 || occupancyEnd < 0) {
    throw new Error(`Availability node ${node.id} is missing its reservation/appointment scan`);
  }
  script = `${script.slice(0, occupancyStart)}${String.raw`  const slotStartMinutes = toMinutes(slot.start);
  const slotEndMinutes = toMinutes(slot.end);
  const windows = reservationWindowsByDoctorAndDate.get(occupancyKey(slot.doctor_id, slot.date)) || [];
  const activeCount = windows.filter((window) =>
    overlaps(slotStartMinutes, slotEndMinutes, window.start, window.end)
  ).length;
  const slotStart = Date.parse(slot.date + "T" + slot.start + ":00+05:30");
  const bookedCount = Number.isFinite(slotStart)
    ? appointmentCountsByDoctorAndStart.get(occupancyKey(slot.doctor_id, slotStart)) || 0
    : 0;
`}${script.slice(occupancyEnd)}`;
  node.data.script = script;
}
