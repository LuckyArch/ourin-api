import { z, ZodSchema, ZodError, ZodIssue } from "zod";
import { errorResponse, getStartTime } from "./response";
import { NextRequest, NextResponse } from "next/server";
import { Parameter } from "../types";

export { z };

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function validate<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.issues.map((e: ZodIssue) => `${e.path.join(".")}: ${e.message}`);
      return { success: false, error: messages.join(", ") };
    }
    return { success: false, error: "Validation failed" };
  }
}

export function validateOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

export function buildSchemaFromParameters(parameters: Parameter[]): ZodSchema {
  const shape: Record<string, z.ZodTypeAny> = {};
  
  for (const param of parameters) {
    let fieldSchema: z.ZodTypeAny;
    
    if (param.type === "select" && param.options && param.options.length > 0) {
      fieldSchema = z.enum(param.options as [string, ...string[]]);
    } else if (param.type === "number") {
      fieldSchema = z.coerce.number();
    } else {
      fieldSchema = z.string();
    }
    
    if (!param.required) {
      fieldSchema = fieldSchema.optional();
      if (param.defaultValue) {
        fieldSchema = fieldSchema.default(param.defaultValue);
      }
    } else {
      if (param.type === "string" || param.type === "select") {
        fieldSchema = z.string().min(1, `${param.name} is required`);
        if (param.type === "select" && param.options && param.options.length > 0) {
          fieldSchema = z.enum(param.options as [string, ...string[]]);
        }
      }
    }
    
    shape[param.name] = fieldSchema;
  }
  
  return z.object(shape);
}

export interface ValidatedRequest<T> {
  data: T;
  startTime: number;
}

export async function validateRequest<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T; startTime: number } | { error: NextResponse }> {
  const startTime = getStartTime();
  
  const params: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  let body = {};
  if (request.method === "POST") {
    try {
      body = await request.json();
    } catch {
      body = {};
    }
  }

  const combined = { ...params, ...body };
  const result = validate(schema, combined);

  if (!result.success) {
    return { error: errorResponse(result.error || "Invalid parameters", 400, startTime) };
  }

  return { data: result.data as T, startTime };
}

export async function validateWithParams<T = Record<string, unknown>>(
  request: NextRequest,
  parameters: Parameter[]
): Promise<{ data: T; startTime: number } | { error: NextResponse }> {
  const schema = buildSchemaFromParameters(parameters);
  return validateRequest<T>(request, schema as ZodSchema<T>);
}

export const commonSchemas = {
  prompt: z.string().min(1, "Prompt is required"),
  url: z.string().url("Invalid URL format"),
  text: z.string().min(1, "Text is required"),
  ratio: z.enum(["1:1", "16:9", "4:3", "3:2", "2:3", "9:16"]).optional().default("1:1"),
  quality: z.enum(["low", "medium", "high", "hd"]).optional().default("medium"),
  format: z.enum(["mp3", "mp4", "webm", "png", "jpg"]).optional(),
};
