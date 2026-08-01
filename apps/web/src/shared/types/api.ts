export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiErrorPayload = {
  success: false;
  message: string;
  errors?: Array<{ code?: string; field?: string; message: string }>;
};

