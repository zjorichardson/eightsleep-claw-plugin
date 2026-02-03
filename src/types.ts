/**
 * Type definitions for OpenClaw plugin API
 */

import type { TObject } from "@sinclair/typebox";

export interface EightSleepConfig {
  email?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
  timezone?: string;
}

export interface ToolResult {
  content: Array<{ type: "text"; text: string } | { type: "image"; data: string; mimeType: string }>;
  isError?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: TObject;
  execute: (id: string, params: Record<string, unknown>) => Promise<ToolResult>;
}

export interface PluginApi {
  config: {
    plugins?: {
      entries?: {
        [key: string]: {
          enabled?: boolean;
          config?: EightSleepConfig;
        };
      };
    };
  };
  logger: {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
    debug: (msg: string) => void;
  };
  registerTool: (tool: ToolDefinition, options?: { optional?: boolean }) => void;
}

// Eight Sleep API response types
export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  userId: string;
}

export interface SleepStage {
  stage: "awake" | "light" | "deep" | "rem";
  duration: number;
}

export interface SleepSession {
  id: string;
  ts: string;
  stages: SleepStage[];
  presenceEnd: string;
  sleepStart: string;
  sleepEnd: string;
  duration: number;
  stageSummary: {
    sleepDuration: number;
    deepDuration: number;
    remDuration: number;
    lightDuration: number;
    awakeDuration: number;
    deepPercentOfSleep: number;
    remPercentOfSleep: number;
  };
  timeseries: {
    heartRate?: Array<[string, number]>;
    hrv?: Array<[string, number]>;
    respiratoryRate?: Array<[string, number]>;
    tempBedC?: Array<[string, number]>;
    tempRoomC?: Array<[string, number]>;
  };
  timezone: string;
}

export interface SleepDay {
  day: string;
  score: number;
  presenceDuration: number;
  sleepDuration: number;
  deepDuration: number;
  remDuration: number;
  lightDuration: number;
  deepPercent: number;
  remPercent?: number;
  tnt: number;
  presenceStart: string;
  presenceEnd: string;
  sleepStart: string;
  sleepEnd: string;
  sessions: SleepSession[];
  sleepQualityScore?: {
    total: number;
    hrv?: { current: number; average: number };
    heartRate?: { current: number; average: number };
    respiratoryRate?: { current: number; average: number };
  };
}

export interface DeviceStatus {
  currentLevel: number;
  currentState: {
    type: string;
  };
}
