const STATES = [
  "ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA",
];

export function randomState(): string {
  return STATES[Math.floor(Math.random() * STATES.length)];
}
