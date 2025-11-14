import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraintInterface } from "class-validator";
import { ValidatorConstraint } from "class-validator";
import { Types } from "mongoose";


@ValidatorConstraint({ name: 'passwordMatch', async: false })
export class MongooseObjectId implements ValidatorConstraintInterface {
  validate(value: Types.ObjectId[]) {
    for (const id of value) {
      if (!Types.ObjectId.isValid(id)) {
        return false;
      }
    }
    return true;
  }
  defaultMessage(): string {
    return `is not a valid MongoDB ObjectId`;
  }
}

@ValidatorConstraint({ name: 'passwordMatch', async: false })
export class PasswordMatch implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    return value === args.object[args.constraints[0] as string];
  }
  defaultMessage(validationArguments?: ValidationArguments): string {
    return `${validationArguments?.property} and ${validationArguments?.constraints[0]} do not match`;
  }
}

export function IsMatch(
  constraints: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: constraints,
      validator: PasswordMatch,
    });
  };
}