import { validateSync } from 'class-validator';

export const configValidationUtility = {
   validateConfig: (config: any) => {
      const errors = validateSync(config);
      if (errors.length > 0) {
         const messages = errors
            .map((error) => Object.values(error.constraints || {}).join(', '))
            .join('; ');
         throw new Error('Validation failed: ' + messages);
      }
   },

   convertToBoolean(value: string | undefined): boolean | null {
      const normalizedValue = value?.trim();

      if (
         normalizedValue === 'true' ||
         normalizedValue === '1' ||
         normalizedValue === 'enabled'
      ) {
         return true;
      }

      if (
         normalizedValue === 'false' ||
         normalizedValue === '0' ||
         normalizedValue === 'disabled'
      ) {
         return false;
      }

      return null;
   },

   getEnumValues<T extends Record<string, string>>(enumObject: T): string[] {
      return Object.values(enumObject);
   },
};
