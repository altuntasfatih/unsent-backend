import type { BaseResponse } from '../types/types.js';

// Generic response creators
export function createSuccessResponse<T extends BaseResponse>(
  data: Omit<T, 'success'>
): T {
  return {
    success: true,
    ...data
  } as T;
}

export function createErrorResponse<T extends BaseResponse>(
  error: string
): T {
  return {
    success: false,
    error
  } as T;
}

// Response senders
export function sendSuccessResponse<T extends BaseResponse>(
  res: any,
  data: Omit<T, 'success'>,
  statusCode: number = 200
) {
  const response = createSuccessResponse<T>(data);
  return res.status(statusCode).json(response);
}

export function sendErrorResponse<T extends BaseResponse>(
  res: any,
  error: string,
  statusCode: number = 400
) {
  const response = createErrorResponse<T>(error);
  return res.status(statusCode).json(response);
} 