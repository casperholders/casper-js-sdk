import { TypedJSON, jsonMember, jsonObject } from 'typedjson';
import { expect } from 'chai';
import {
  EntryPointAccess,
  GroupsEntryPointAccess,
  matchEntryPointAccess
} from './EntryPointAccess';
import { fail } from 'assert';

@jsonObject
class UnderTest {
  @jsonMember({
    deserializer: json => matchEntryPointAccess(json),
    serializer: value => value.toJSON()
  })
  public x: EntryPointAccess;
}
describe('EntryPointAccess', () => {
  const serializer = new TypedJSON(UnderTest);
  it('should parse EntryPointAccess::Public correctly', () => {
    const mockJson = { x: 'Public' };
    const parsed = serializer.parse(mockJson);
    if (parsed) {
      const reserialized = JSON.parse(serializer.stringify(parsed));
      expect(reserialized).to.deep.eq(mockJson);
    } else {
      fail('EntryPointAccess is undefined');
    }
  });

  it('should parse EntryPointAccess::Template correctly', () => {
    const mockJson = { x: 'Template' };
    const parsed = serializer.parse(mockJson);
    if (parsed) {
      const reserialized = JSON.parse(serializer.stringify(parsed));
      expect(reserialized).to.deep.eq(mockJson);
    } else {
      fail('EntryPointAccess is undefined');
    }
  });

  it('should parse EntryPointAccess::Groups correctly', () => {
    const mockJson = { x: { Groups: ['group1', 'group2'] } };
    const parsed = serializer.parse(mockJson);
    expect(parsed?.x).not.to.be.undefined;
    const groupsEntryPointAccess = parsed?.x as GroupsEntryPointAccess;
    expect(groupsEntryPointAccess.Groups).to.eql(['group1', 'group2']);
    if (parsed) {
      const reserialized = JSON.parse(serializer.stringify(parsed));
      expect(reserialized).to.deep.eq(mockJson);
    } else {
      fail('EntryPointAccess is undefined');
    }
  });
});
