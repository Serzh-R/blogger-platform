export const getRefreshTokenCookieWithAttributes = (
   setCookieHeader: unknown,
): string => {
   // Проверяем наличие массива cookie в ответе.
   if (!Array.isArray(setCookieHeader)) {
      throw new Error('Set-Cookie header must be an array');
   }

   // Находим полную строку refresh cookie вместе с атрибутами.
   const refreshTokenCookieWithAttributes = setCookieHeader.find(
      (cookie: string) => cookie.startsWith('refreshToken='),
   );

   if (typeof refreshTokenCookieWithAttributes !== 'string') {
      throw new Error('Refresh token cookie is missing');
   }

   return refreshTokenCookieWithAttributes;
};

export const getRefreshTokenCookie = (setCookieHeader: unknown): string => {
   const refreshTokenCookieWithAttributes =
      getRefreshTokenCookieWithAttributes(setCookieHeader);

   // Оставляем имя и значение cookie для отправки в запросе.
   return refreshTokenCookieWithAttributes.split(';')[0];
};
