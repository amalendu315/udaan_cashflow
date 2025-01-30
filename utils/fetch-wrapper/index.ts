interface FetchWrapperConfig {
  method?: string; // HTTP method (GET, POST, PUT, DELETE, etc.)
  headers?: Record<string, string>; // Custom headers
  body?: any; // Request body
  includeAuth?: boolean; // Whether to include authorization token
}

export class FetchWrapper {
  private getToken: () => string | null;

  constructor(getToken: () => string | null) {
    this.getToken = getToken;
  }

  public async request<T>(
    endpoint: string,
    config: FetchWrapperConfig = {}
  ): Promise<T> {
    const { method = "GET", headers = {}, body, includeAuth = true } = config;

    // Ensure the endpoint starts with a "/"
    const url = endpoint.startsWith("/")
      ? `/api${endpoint}`
      : `/api/${endpoint}`;

    // Set up headers
    const finalHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    // Include authorization token if required
    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        finalHeaders["Authorization"] = `Bearer ${token}`;
      } else {
        throw new Error("Authorization token is missing");
      }
    }

    // Configure fetch options
    const options: RequestInit = {
      method,
      headers: finalHeaders,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      // Perform the fetch request
      const response = await fetch(url, options);

      // Handle non-2xx responses
      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(
          errorResponse.message ||
            `Request failed with status ${response.status}`
        );
      }

      // Parse JSON response
      return await response.json();
    } catch (error: any) {
      console.error("FetchWrapper Error:", error);
      throw new Error(error.message || "An unexpected error occurred");
    }
  }

  // Convenience methods
  public get<T>(endpoint: string, config?: FetchWrapperConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: "GET" });
  }

  public post<T>(
    endpoint: string,
    body: any,
    config?: FetchWrapperConfig
  ): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: "POST", body });
  }

  public put<T>(
    endpoint: string,
    body: any,
    config?: FetchWrapperConfig
  ): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: "PUT", body });
  }

  public delete<T>(endpoint: string, config?: FetchWrapperConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: "DELETE" });
  }
}
