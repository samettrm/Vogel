export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'aborted'
  | 'notFound'
  | 'server'
  | 'parse';

export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
