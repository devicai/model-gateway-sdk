export interface DevicRuleUsage {
  scope: 'tenant' | 'subtenant';
  subtenantId?: string;
  metric: 'tokens' | 'cost';
  windowUnit: string;
  windowEvery: number;
  limit: number;
  current: number;
  percent: number;
  resetsAt: number;
  origin: 'tier' | 'adhoc';
  tierId?: string;
}

export interface DevicUsageInfo {
  tenantId: string;
  subtenantId?: string;
  usage: DevicRuleUsage[];
}

/** Any OpenAI response returned through the Devic gateway carries this extra field. */
export type WithDevicUsage<T> = T & { devic?: DevicUsageInfo };
