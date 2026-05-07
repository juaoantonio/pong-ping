import { BadRequestException, ValidationPipe } from "@nestjs/common";

export function createValidationPipe() {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) =>
      new BadRequestException(
        errors.map((error) => ({
          field: error.property,
          constraints: error.constraints ?? {},
        })),
      ),
  });
}
