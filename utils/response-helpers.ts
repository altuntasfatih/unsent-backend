import type { BaseResponse } from '../types/types.js';

// Generic response creators
export function createSuccessResponse<T extends BaseResponse>(
  data: Omit<T, 'success'>,
  message?: string
): T {
  return {
    success: true,
    message,
    ...data
  } as T;
}

export function createErrorResponse<T extends BaseResponse>(
  error: string,
  message?: string
): T {
  return {
    success: false,
    error,
    message
  } as T;
}

// Response senders
export function sendSuccessResponse<T extends BaseResponse>(
  res: any,
  data: Omit<T, 'success'>,
  message?: string,
  statusCode: number = 200
) {
  const response = createSuccessResponse<T>(data, message);
  return res.status(statusCode).json(response);
}

export function sendErrorResponse<T extends BaseResponse>(
  res: any,
  error: string,
  message?: string,
  statusCode: number = 400
) {
  const response = createErrorResponse<T>(error, message);
  return res.status(statusCode).json(response);
} 