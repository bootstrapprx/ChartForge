export interface ApiError {
  message: string;
  details?: string | Record<string, any>;
}
