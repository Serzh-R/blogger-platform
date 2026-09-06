export enum ResultStatus {
    Success = 'Success',
    Created = 'Created',
    NoContent = 'NoContent',
    BadRequest = 'BadRequest',
    Unauthorized = 'Unauthorized',
    Forbidden = 'Forbidden',
    NotFound = 'NotFound',
    ServerError = 'ServerError',
}

export type Extension = {
    field: string;
    message: string;
};

export type Result<T = null> = {
    status: ResultStatus;
    errorMessage?: string;
    extensions: Extension[];
    data: T | null;
};