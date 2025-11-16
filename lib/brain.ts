export type Intent =
  | "greeting"
  | "energy_check"
  | "goodbye"
  | "unknown";

export function classifyIntent(text: string): Intent {
  const t = text.toLowerCase();
  if (/(hi|hello|hey|howdy)/.test(t)) return "greeting";
  if (/(energy|how’s your energy|how is your energy|check-in|check in)/.test(t)) return "energy_check";
  if (/(bye|goodbye|see ya|later)/.test(t)) return "goodbye";
  return "unknown";
}
