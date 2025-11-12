import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ValidatorConstraint } from 'class-validator';

@ValidatorConstraint({ name: 'checkFields', async: false })
export class CheckFields implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    return (
      Object.keys(args.object).length > 0 &&
      Object.values(args.object).filter((arg) => {
        return arg !== undefined;
      }).length > 0
    );
  }
  defaultMessage(): string {
    return `all fields are required`;
  }
}

export function containFields(validationOptions?: ValidationOptions) {
  return function (constructor: any) {
    registerDecorator({
      target: constructor,
      propertyName: undefined!,
      options: validationOptions,
      constraints: [],
      validator: CheckFields,
    });
  };
}
