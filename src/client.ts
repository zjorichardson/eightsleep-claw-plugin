/**
 * Eight Sleep API Client
 * Handles OAuth authentication and API calls
 */

import type { AuthResponse, SleepDay, DeviceStatus } from "./types.js";

// Default Android app credentials (extracted from app)
const DEFAULT_CLIENT_ID = "0894c7f33bb94800a03f1f4df13a4f38";
const DEFAULT_CLIENT_SECRET = "f0954a3ed5763ba3d06834c73731a32f15f168f47d4f164751275def86db0c76";
const AUTH_URL = "https://auth-api.8slp.net/v1/tokens";
const API_URL = "https://client-api.8slp.net/v1";

export interface EightSleepCredentials {
  email: string;
  password: string;
  clientId?: string;
  clientSecret?: string;
  timezone?: string;
}

interface TokenCache {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
}

export class EightSleepClient {
  private email: string;
  private password: string;
  private clientId: string;
  private clientSecret: string;
  private timezone: string;
  private tokenCache: TokenCache | null = null;

  constructor(creds: EightSleepCredentials) {
    this.email = creds.email;
    this.password = creds.password;
    this.clientId = creds.clientId || DEFAULT_CLIENT_ID;
    this.clientSecret = creds.clientSecret || DEFAULT_CLIENT_SECRET;
    this.timezone = creds.timezone || "America/Chicago";
  }

  /**
   * Authenticate and get access token
   */
  private async authenticate(): Promise<TokenCache> {
    const response = await fetch(AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Eight Sleep/7.46.0 (Android)",
      },
      body: JSON.stringify({
        grant_type: "password",
        username: this.email,
        password: this.password,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Eight Sleep auth failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as AuthResponse;
    
    this.tokenCache = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
      userId: data.userId,
    };

    return this.tokenCache;
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<TokenCache> {
    if (!this.tokenCache?.refreshToken) {
      return this.authenticate();
    }

    const response = await fetch(AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Eight Sleep/7.46.0 (Android)",
      },
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: this.tokenCache.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      // Refresh failed, re-authenticate
      return this.authenticate();
    }

    const data = (await response.json()) as AuthResponse;
    
    this.tokenCache = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
      userId: data.userId,
    };

    return this.tokenCache;
  }

  /**
   * Get valid access token, refreshing if needed
   */
  private async getToken(): Promise<TokenCache> {
    if (!this.tokenCache) {
      return this.authenticate();
    }

    if (Date.now() >= this.tokenCache.expiresAt) {
      return this.refreshAccessToken();
    }

    return this.tokenCache;
  }

  /**
   * Make authenticated API request
   */
  private async request<T = unknown>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getToken();
    const url = `${API_URL}${path}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "Eight Sleep/7.46.0 (Android)",
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expired, refresh and retry
      await this.refreshAccessToken();
      return this.request<T>(path, options);
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Eight Sleep API error (${response.status}): ${text}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get current user ID
   */
  async getUserId(): Promise<string> {
    const token = await this.getToken();
    return token.userId;
  }

  /**
   * Get device/temperature status
   */
  async getStatus(): Promise<DeviceStatus> {
    const userId = await this.getUserId();
    return this.request<DeviceStatus>(`/users/${userId}/temperature`);
  }

  /**
   * Turn pod on
   */
  async turnOn(): Promise<void> {
    const userId = await this.getUserId();
    await this.request(`/users/${userId}/devices/power`, {
      method: "POST",
      body: JSON.stringify({ on: true }),
    });
  }

  /**
   * Turn pod off
   */
  async turnOff(): Promise<void> {
    const userId = await this.getUserId();
    await this.request(`/users/${userId}/devices/power`, {
      method: "POST",
      body: JSON.stringify({ on: false }),
    });
  }

  /**
   * Set temperature level (-100 to 100)
   */
  async setTemperature(level: number): Promise<void> {
    if (level < -100 || level > 100) {
      throw new Error("Temperature level must be between -100 and 100");
    }
    const userId = await this.getUserId();
    await this.request(`/users/${userId}/temperature`, {
      method: "PUT",
      body: JSON.stringify({ currentLevel: level }),
    });
  }

  /**
   * Get sleep data for a specific date
   */
  async getSleepDay(date: string): Promise<SleepDay | null> {
    const userId = await this.getUserId();
    const params = new URLSearchParams({
      tz: this.timezone,
      from: date,
      to: date,
      "include-main": "false",
      "include-all-sessions": "true",
      "model-version": "v2",
    });

    const result = await this.request<{ days: SleepDay[] }>(
      `/users/${userId}/trends?${params}`
    );

    return result.days?.[0] || null;
  }

  /**
   * Get sleep data for date range
   */
  async getSleepRange(from: string, to: string): Promise<SleepDay[]> {
    const userId = await this.getUserId();
    const params = new URLSearchParams({
      tz: this.timezone,
      from,
      to,
      "include-main": "false",
      "include-all-sessions": "true",
      "model-version": "v2",
    });

    const result = await this.request<{ days: SleepDay[] }>(
      `/users/${userId}/trends?${params}`
    );

    return result.days || [];
  }

  /**
   * Get user info
   */
  async getUserInfo(): Promise<unknown> {
    return this.request("/users/me");
  }

  /**
   * Get device info
   */
  async getDeviceInfo(): Promise<unknown> {
    const userId = await this.getUserId();
    return this.request(`/users/${userId}/devices`);
  }
}
