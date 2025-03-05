import type { IncomingMessage, ServerResponse } from 'node:http'

export type ApiRequest = IncomingMessage & {
  query: { [key: string]: string | string[] }
  cookies: { [key: string]: string }
  body: any
}

export type ApiResponse = ServerResponse & {
  send: (body: any) => ApiResponse
  json: (jsonBody: any) => ApiResponse
  status: (statusCode: number) => ApiResponse
  redirect: (statusOrUrl: string | number, url?: string) => ApiResponse
}
