import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

export const ResponseTypeSchema = z.enum(["json", "image", "audio", "video"]);
export type ResponseType = z.infer<typeof ResponseTypeSchema>;

export const ParameterSchema = z.object({
  name: z.string().min(1),
  required: z.boolean(),
  description: z.string(),
  type: z.enum(["string", "number", "select"]),
  defaultValue: z.string().optional(),
  options: z.array(z.string()).optional(),
});
export type Parameter = z.infer<typeof ParameterSchema>;

export const EndpointMetaSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  path: z.string().min(1),
  method: z.enum(["GET", "POST"]),
  responseType: ResponseTypeSchema,
  tags: z.array(z.string()),
  parameters: z.array(ParameterSchema),
});
export type EndpointMeta = z.infer<typeof EndpointMetaSchema>;

export type RunFunction = (request: NextRequest) => Promise<NextResponse>;

export interface PluginEndpoint extends EndpointMeta {
  run: RunFunction;
}

export const PluginSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  category: z.string().min(1),
  description: z.string().optional(),
});

export interface Plugin {
  name: string;
  slug: string;
  category: string;
  description?: string;
  endpoint: PluginEndpoint;
}

export function validatePluginMeta(data: unknown): Omit<Plugin, "endpoint"> {
  return PluginSchema.parse(data);
}

export function validateEndpointMeta(data: unknown): EndpointMeta {
  return EndpointMetaSchema.parse(data);
}
