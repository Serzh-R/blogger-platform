import { DomainExceptionCode } from './domain-exception-codes';

export type Extension = {
   message: string;
   field: string;
};

export class DomainException extends Error {
   code: DomainExceptionCode;
   extensions: Extension[];

   constructor(errorInfo: {
      code: DomainExceptionCode;
      message: string;
      extensions?: Extension[];
   }) {
      super(errorInfo.message);

      this.code = errorInfo.code;
      this.extensions = errorInfo.extensions ?? [];
   }
}
