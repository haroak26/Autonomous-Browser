import { z } from 'zod';
import { browserActionSchema, browserStateSchema, chatRequestSchema, chatResponseSchema, history } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  browser: {
    launch: {
      method: 'POST' as const,
      path: '/api/browser/launch',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    action: {
      method: 'POST' as const,
      path: '/api/browser/action',
      input: browserActionSchema,
      responses: {
        200: browserStateSchema,
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
    status: {
      method: 'GET' as const,
      path: '/api/browser/status',
      responses: {
        200: browserStateSchema,
        500: errorSchemas.internal,
      },
    },
    stop: {
      method: 'POST' as const,
      path: '/api/browser/stop',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
  },
  ai: {
    command: {
      method: 'POST' as const,
      path: '/api/ai/command',
      input: chatRequestSchema,
      responses: {
        200: chatResponseSchema,
        500: errorSchemas.internal,
      },
    },
  },
  history: {
    list: {
      method: 'GET' as const,
      path: '/api/history',
      responses: {
        200: z.array(z.custom<typeof history.$inferSelect>()),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type BrowserActionInput = z.infer<typeof api.browser.action.input>;
export type BrowserStateResponse = z.infer<typeof api.browser.action.responses[200]>;
