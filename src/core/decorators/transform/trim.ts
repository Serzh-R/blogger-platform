import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';

export const Trim = () => {
   return Transform(({ value }: TransformFnParams) =>
      typeof value === 'string' ? value.trim() : value,
   );
};
