import { applyDecorators, type Type } from "@nestjs/common";
import { ApiExtraModels, ApiProperty, ApiResponse, getSchemaPath } from "@nestjs/swagger";
import type {
  ReferenceObject,
  SchemaObject,
} from "@nestjs/swagger/dist/interfaces/open-api-spec.interface";

export class ApiSuccessMetaDto {
  @ApiProperty({
    required: false,
    example: "req_01HXJ6QEW4Q7TSKJ8Y9V8CXF5A",
  })
  requestId?: string;

  @ApiProperty({ example: "2026-05-08T20:00:00.000Z" })
  timestamp!: string;
}

export class ApiSuccessEnvelopeDto {
  @ApiProperty({ example: true })
  ok!: true;

  @ApiProperty()
  data!: unknown;

  @ApiProperty({ type: ApiSuccessMetaDto })
  meta!: ApiSuccessMetaDto;
}

export class ApiErrorDto {
  @ApiProperty({ example: 400 })
  status!: number;

  @ApiProperty({ example: "invalid_request" })
  code!: string;

  @ApiProperty({ example: "Request validation failed." })
  message!: string;

  @ApiProperty({ type: [Object], example: ["name must be longer than or equal to 1 characters"] })
  details!: unknown[];

  @ApiProperty({ example: "/api/system/admin/tenants" })
  path!: string;

  @ApiProperty({ example: "POST" })
  method!: string;

  @ApiProperty({
    required: false,
    example: "req_01HXJ6QEW4Q7TSKJ8Y9V8CXF5A",
  })
  requestId?: string;

  @ApiProperty({ example: "2026-05-08T20:00:00.000Z" })
  timestamp!: string;
}

export class ApiErrorEnvelopeDto {
  @ApiProperty({ example: false })
  ok!: false;

  @ApiProperty({ type: ApiErrorDto })
  error!: ApiErrorDto;
}

type SchemaInput = Type<unknown> | SchemaObject | ReferenceObject;

export type ApiEnvelopeDataSchema = SchemaInput | readonly [SchemaInput] | null | undefined;

export type ApiErrorEnvelopeOptions = {
  status: number;
  description: string;
};

export function ApiSuccessEnvelopeResponse(options: {
  status: number;
  description: string;
  data?: ApiEnvelopeDataSchema;
  extraModels?: Type<unknown>[];
}) {
  const extraModels = modelsFromData(options.data, options.extraModels);

  return applyDecorators(
    ApiExtraModels(ApiSuccessEnvelopeDto, ApiSuccessMetaDto, ...extraModels),
    ApiResponse({
      status: options.status,
      description: options.description,
      schema: successEnvelopeSchema(options.data),
    }),
  );
}

export function ApiErrorEnvelopeResponse(options: ApiErrorEnvelopeOptions) {
  return applyDecorators(
    ApiExtraModels(ApiErrorEnvelopeDto, ApiErrorDto),
    ApiResponse({
      status: options.status,
      description: options.description,
      schema: { $ref: getSchemaPath(ApiErrorEnvelopeDto) },
    }),
  );
}

export function ApiErrorEnvelopeResponses(...responses: ApiErrorEnvelopeOptions[]) {
  return applyDecorators(...responses.map((response) => ApiErrorEnvelopeResponse(response)));
}

function successEnvelopeSchema(data?: ApiEnvelopeDataSchema): SchemaObject {
  return {
    allOf: [
      { $ref: getSchemaPath(ApiSuccessEnvelopeDto) },
      {
        type: "object",
        required: ["ok", "data", "meta"],
        properties: {
          ok: { type: "boolean", enum: [true], example: true },
          data: dataSchema(data),
          meta: { $ref: getSchemaPath(ApiSuccessMetaDto) },
        },
      },
    ],
  };
}

function dataSchema(data?: ApiEnvelopeDataSchema): SchemaObject | ReferenceObject {
  if (data === null || data === undefined) {
    return { nullable: true, example: null };
  }

  if (isArraySchema(data)) {
    return {
      type: "array",
      items: schemaRef(data[0]),
    };
  }

  return schemaRef(data);
}

function schemaRef(input: SchemaInput): SchemaObject | ReferenceObject {
  if (typeof input === "function") {
    return { $ref: getSchemaPath(input) };
  }

  return input;
}

function modelsFromData(
  data: ApiEnvelopeDataSchema,
  extraModels: Type<unknown>[] = [],
): Type<unknown>[] {
  const models = new Set<Type<unknown>>(extraModels);
  const input = isArraySchema(data) ? data[0] : data;

  if (typeof input === "function") {
    models.add(input);
  }

  return [...models];
}

function isArraySchema(data: ApiEnvelopeDataSchema): data is readonly [SchemaInput] {
  return Array.isArray(data);
}
