/**
 * API client with retry logic for Nexus QC system
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const RETRY_ATTEMPTS = 3
const RETRY_DELAY_MS = 1000
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504]

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Fetch with exponential backoff retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  attempts = RETRY_ATTEMPTS
): Promise<Response> {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url, options)

      // Retry on specific status codes
      if (i < attempts - 1 && RETRY_STATUS_CODES.includes(response.status)) {
        console.warn(`Request failed with status ${response.status}, retrying... (${i + 1}/${attempts})`)
        await sleep(RETRY_DELAY_MS * (i + 1)) // Exponential backoff
        continue
      }

      return response
    } catch (error) {
      // Retry on network errors
      if (i < attempts - 1) {
        console.warn(`Network error, retrying... (${i + 1}/${attempts})`, error)
        await sleep(RETRY_DELAY_MS * (i + 1))
        continue
      }
      throw error
    }
  }

  throw new Error('Max retry attempts reached')
}

/**
 * Generic API client with type safety and error handling
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const response = await fetchWithRetry(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: `HTTP ${response.status}: ${response.statusText}`,
    }))
    throw new Error(error.detail || 'API request failed')
  }

  return response.json()
}
