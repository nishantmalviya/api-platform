import { z } from "zod";

export const HttpMethodSchema = z.enum([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
]);
export type HttpMethod = z.infer<typeof HttpMethodSchema>;

export const RequestBodyTypeSchema = z.enum([
  "none",
  "json",
  "text",
  "form",
  "multipart",
  "binary",
  "xml",
]);
export type RequestBodyType = z.infer<typeof RequestBodyTypeSchema>;

export const AuthTypeSchema = z.enum([
  "none",
  "basic",
  "bearer",
  "apiKey",
  "oauth2",
  "mtls",
]);
export type AuthType = z.infer<typeof AuthTypeSchema>;

export const RequestOptionsSchema = z.object({
  timeoutMs: z.number().int().positive(),
  followRedirects: z.boolean(),
  maxRedirects: z.number().int().min(0),
  tlsVerification: z.boolean(),
  maxResponseBytes: z.number().int().positive(),
});
export type RequestOptions = z.infer<typeof RequestOptionsSchema>;

export const ApiRequestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  method: HttpMethodSchema,
  url: z.string().min(1),
  headers: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
        enabled: z.boolean(),
      }),
    )
    .default([]),
  queryParams: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
        enabled: z.boolean(),
      }),
    )
    .default([]),
  body: z
    .object({
      type: RequestBodyTypeSchema,
      content: z.string().optional(),
      fileRef: z.string().optional(),
    })
    .optional(),
  auth: z
    .object({
      type: AuthTypeSchema,
      credentialRef: z.string().optional(),
    })
    .optional(),
  environmentId: z.string().optional(),
  workspaceId: z.string().optional(),
  collectionId: z.string().optional(),
  folderId: z.string().optional(),
  options: RequestOptionsSchema,
});
export type ApiRequest = z.infer<typeof ApiRequestSchema>;

export const ApiResponseSchema = z.object({
  requestId: z.string(),
  status: z.number(),
  statusText: z.string(),
  headers: z.record(z.string(), z.array(z.string())),
  durationMs: z.number(),
  bodyRef: z.string().optional(),
  bodyPreview: z.string().optional(),
  truncated: z.boolean(),
  sizeBytes: z.number(),
});
export type ApiResponse = z.infer<typeof ApiResponseSchema>;
