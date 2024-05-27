import { TypedJSON, jsonArrayMember, jsonObject } from 'typedjson';

export abstract class EntryPointAccess {
  public abstract toJSON(): unknown;
}

export class PublicEntryPointAccess extends EntryPointAccess {
  public toJSON(): string {
    return 'Public';
  }
}

export class TemplateEntryPointAccess extends EntryPointAccess {
  public toJSON(): string {
    return 'Template';
  }
}

@jsonObject
export class GroupsEntryPointAccess extends EntryPointAccess {
  @jsonArrayMember(String)
  public Groups: string[];

  public toJSON(): unknown {
    return {
      Groups: this.Groups
    };
  }
}

const serializer = new TypedJSON(GroupsEntryPointAccess);

export const matchEntryPointAccess = (
  type: any
): EntryPointAccess | undefined => {
  if (type === 'Public') {
    return new PublicEntryPointAccess();
  } else if (type === 'Template') {
    return new TemplateEntryPointAccess();
  } else if (type instanceof Object) {
    const ret = serializer.parse(type);
    return ret;
  }
  return undefined;
};
