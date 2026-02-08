const ERROR_MAP: Array<{ pattern: RegExp; message: string; messageEs: string }> = [
  {
    pattern: /constraint|unique|duplicate/i,
    message: "This email or phone number is already registered.",
    messageEs: "Este correo o n\u00famero ya est\u00e1 registrado.",
  },
  {
    pattern: /stripe|payment.*declined|card/i,
    message: "Payment declined. Please check your card details.",
    messageEs: "Pago rechazado. Verifica los datos de tu tarjeta.",
  },
  {
    pattern: /not found|404/i,
    message: "We couldn't find what you're looking for.",
    messageEs: "No pudimos encontrar lo que buscas.",
  },
  {
    pattern: /unauthorized|401|not authenticated/i,
    message: "Please sign in to continue.",
    messageEs: "Inicia sesi\u00f3n para continuar.",
  },
  {
    pattern: /forbidden|403|access denied/i,
    message: "You don't have permission to do that.",
    messageEs: "No tienes permiso para hacer eso.",
  },
  {
    pattern: /timeout|timed out/i,
    message: "The request took too long. Please try again.",
    messageEs: "La solicitud tard\u00f3 demasiado. Int\u00e9ntalo de nuevo.",
  },
  {
    pattern: /network|fetch|connection/i,
    message: "Network error. Check your internet connection.",
    messageEs: "Error de red. Revisa tu conexi\u00f3n a internet.",
  },
  {
    pattern: /file.*too.*large|size.*limit/i,
    message: "The file is too large. Please try a smaller one.",
    messageEs: "El archivo es muy grande. Intenta con uno m\u00e1s peque\u00f1o.",
  },
];

export function translateError(error: unknown, lang: string = "en"): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "unknown";

  for (const entry of ERROR_MAP) {
    if (entry.pattern.test(raw)) {
      return lang === "es" ? entry.messageEs : entry.message;
    }
  }

  return lang === "es"
    ? "Algo sali\u00f3 mal. Int\u00e9ntalo de nuevo."
    : "Something went wrong. Please try again.";
}
