const ERROR_MESSAGES: Record<string, string> = {
  E_INVALID_CREDENTIALS: "Неверный пароль. Проверьте введённые данные и попробуйте снова.",
  E_USER_NOT_FOUND: "Пользователь с указанным номером не найден. Зарегистрируйтесь или проверьте номер.",
  E_USER_IS_BANNED: "Аккаунт заблокирован. Обратитесь в службу поддержки.",
  E_WRONG_CODE: "Неверный код. Повторите попытку.",
  E_CODE_EXPIRED: "Срок действия кода истёк. Запросите новый код.",
  E_CODE_ATTEMPT_LIMIT_EXCEEDED: "Превышено число попыток ввода кода. Запросите новый код позже.",
  E_FLOOD_CONTROL: "Слишком много запросов. Попробуйте через несколько минут.",
  E_ALREADY_REGISTERED: "Пользователь с такими данными уже зарегистрирован.",
  E_ACCESS_DENIED: "Недостаточно прав для выполнения действия.",
  E_UNAUTHORIZED_ACCESS: "Войдите в систему, чтобы продолжить.",
  E_INVALID_OPERATION: "Операция недоступна. Попробуйте позже.",
  E_EXTERNAL_SERVICE_ERROR: "Внешний сервис недоступен. Попробуйте позже.",
};

const FALLBACK_MESSAGE = "Не удалось выполнить запрос. Попробуйте позже.";

export const parseError = (error: Error): string => {
  if (!error) return FALLBACK_MESSAGE;

  const rawMessage = typeof error.message === "string" ? error.message.trim() : "";

  if (rawMessage) {
    try {
      const parsed = JSON.parse(rawMessage);
      const code = parsed?.error?.code as string | undefined;
      const messages = parsed?.error?.messages as unknown;

      if (code && ERROR_MESSAGES[code]) {
        return ERROR_MESSAGES[code];
      }

      if (Array.isArray(messages) && messages.length > 0) {
        return messages.filter((message): message is string => typeof message === "string").join("\n");
      }

      if (code) {
        return ERROR_MESSAGES[code] ?? FALLBACK_MESSAGE;
      }
    } catch {
      // ignore JSON parse errors, fallback below
    }

    if (rawMessage && rawMessage !== "Unknown error") {
      return rawMessage;
    }
  }

  return FALLBACK_MESSAGE;
};
