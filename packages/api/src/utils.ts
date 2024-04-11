type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamelCase<U>>}`
  : S;

export type ISnakeToCamelCase<T> = {
  [K in keyof T as SnakeToCamelCase<string & K>]: T[K];
};

type CamelToSnakeCase<S extends string> = S extends `${infer T}${infer U}`
  ? `${T extends Capitalize<T> ? '_' : ''}${Lowercase<T>}${CamelToSnakeCase<U>}`
  : S;

export type ICamelToSnakeCase<T> = {
  [K in keyof T as CamelToSnakeCase<string & K>]: T[K];
};

type DataPropertyNames<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

type DataPropertiesOnly<T> = {
  [P in DataPropertyNames<T>]: T[P] extends object ? DTO<T[P]> : T[P];
};

export type DTO<T> = DataPropertiesOnly<T>;

// Uage:
//
// declare class Person1 {
//   firstName: string;
//   myAge: number;
//   location: string;
//   available(now: number): boolean;
// }

// declare class Person2 {
//   first_name: string;
//   my_age: number;
//   location: string;
//   available(now: number): boolean;
// }

// type SnakePerson = ICamelToSnakeCase<DTO<Person1>>;
// type CamelPerson = ISnakeToCamelCase<DTO<Person2>>;
