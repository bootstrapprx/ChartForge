export interface MappingPayload {
  company_id: string;
  // Add other mapping parameters if required by the API
}

export interface MappingResponse {
  status: string;
  mapped_accounts: number;
  total_accounts: number;
}
