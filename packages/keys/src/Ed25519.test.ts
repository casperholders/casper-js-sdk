import {
  CLPublicKey,
  byteHash,
  decodeBase16,
  decodeBase64
} from '@casper-js-sdk/types';
import { expect } from 'chai';
import sinon from 'sinon';

import { Ed25519 } from './Ed25519';

describe('Ed25519', () => {
  const isNodeJS = typeof window === 'undefined';

  // prettier-ignore
  const privateKey = new Uint8Array([
    92,  85,  34,  21, 229, 142, 168,
    76, 221, 116,  56, 193, 153, 129,
    32, 198, 125,  90, 231, 143, 220,
   220, 158,  37, 196, 198,  34, 177,
   100, 221, 229, 228
  ]);
  // prettier-ignore
  const publicKey = new Uint8Array([
    225, 123,  67, 141, 123,  40, 119, 138,
    213, 235, 175,  59,  71, 169,  39, 235,
    243, 228, 113, 203,  25,   9, 125,  64,
      97, 165, 224,  86,  97, 251,   1,  91
  ]);

  it('should support old key format', () => {
    const keyPair = new Ed25519({
      publicKey: publicKey,
      secretKey: privateKey
    });

    expect(keyPair.privateKey).deep.equal(privateKey);
    expect(keyPair.publicKey.value()).deep.equal(publicKey);
  });

  it('should throw error when private key is not provided', () => {
    const badFn1 = () =>
      // @ts-ignore
      new Ed25519({
        publicKey: publicKey
      });
    const badFn2 = () =>
      // @ts-ignore
      new Ed25519(publicKey);

    expect(badFn1).to.throw('private key is required');
    expect(badFn2).to.throw('private key is required');
  });

  if (isNodeJS) {
    it('should import keys from saved file', () => {
      const publicKeyPath = __dirname + '/../assets/ed25519/public_key.pem';
      const privateKeyPath = __dirname + '/../assets/ed25519/private_key.pem';

      const publicKeyFromFile = Ed25519.parsePublicKeyFile(publicKeyPath);
      expect(publicKeyFromFile).to.deep.eq(publicKey);

      const privateKeyFromFile = Ed25519.parsePrivateKeyFile(privateKeyPath);
      expect(privateKeyFromFile).to.deep.eq(privateKey);

      const keyPair1 = Ed25519.parseKeyFiles(publicKeyPath, privateKeyPath);
      expect(keyPair1.publicKey.value()).to.deep.eq(publicKey);
      expect(keyPair1.privateKey).to.deep.eq(privateKey);

      const keyPair2 = Ed25519.loadKeyPairFromPrivateFile(privateKeyPath);

      expect(keyPair2.publicKey.value()).to.deep.eq(publicKey);
      expect(keyPair2.privateKey).to.deep.eq(privateKey);
    });
  }

  it('should export keys to PEM', () => {
    const keyPair = new Ed25519(publicKey, privateKey);

    const publicKeyPEMString = keyPair.exportPublicKeyInPem();
    const privateKeyPEMString = keyPair.exportPrivateKeyInPem();

    expect(publicKeyPEMString).to.eq(
      '-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA4XtDjXsod4rV6687R6kn6/PkccsZCX1AYaXgVmH7AVs=\n-----END PUBLIC KEY-----\n'
    );
    expect(privateKeyPEMString).to.eq(
      '-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIFxVIhXljqhM3XQ4wZmBIMZ9WueP3NyeJcTGIrFk3eXk\n-----END PRIVATE KEY-----\n'
    );
  });

  it('should throw error when key length is incorrect', () => {
    const invalidKey = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

    const badFn = () => Ed25519.parsePublicKey(invalidKey);

    expect(badFn).to.throw(`Unexpected key length: ${invalidKey.length}`);
  });

  it('calculates the account hash', () => {
    const signKeyPair = Ed25519.new();
    // use lower case for node-rs
    const name = Buffer.from('ED25519'.toLowerCase());
    const sep = decodeBase16('00');
    const bytes = Buffer.concat([name, sep, signKeyPair.publicKey.value()]);
    const hash = byteHash(bytes);

    expect(Ed25519.accountHash(signKeyPair.publicKey.value())).deep.equal(hash);
  });

  it('should deal with different line-endings', () => {
    const keyWithoutPem =
      'MCowBQYDK2VwAyEA4PFXL2NuakBv3l7yrDg65HaYQtxKR+SCRTDI+lXBoM8=';
    const key1 = decodeBase64(keyWithoutPem);
    const keyWithLF =
      '-----BEGIN PUBLIC KEY-----\n' +
      'MCowBQYDK2VwAyEA4PFXL2NuakBv3l7yrDg65HaYQtxKR+SCRTDI+lXBoM8=\n' +
      '-----END PUBLIC KEY-----\n';
    const key2 = Ed25519.readBase64WithPEM(keyWithLF);
    expect(key2).to.deep.eq(key1);
    const keyWithCRLF =
      '-----BEGIN PUBLIC KEY-----\r\n' +
      'MCowBQYDK2VwAyEA4PFXL2NuakBv3l7yrDg65HaYQtxKR+SCRTDI+lXBoM8=\r\n' +
      '-----END PUBLIC KEY-----\r\n';
    const key3 = Ed25519.readBase64WithPEM(keyWithCRLF);
    expect(key3).to.deep.eq(key1);
  });

  it('should parse old 64 bytes private key', () => {
    // In v2.10 we used https://www.npmjs.com/package/tweetnacl-ts#sign_keypair which private key length is 64 bytes,
    // From v2.13 migrated to noble scope libraries which private key length is 32 bytes [correct implementation]
    // new version should support old format

    const privateKeyPEM =
      '-----BEGIN PRIVATE KEY-----\n' +
      'MC4CAQAwBQYDK2VwBCIEIFxVIhXljqhM3XQ4wZmBIMZ9WueP3NyeJcTGIrFk3eXk=\n' +
      '-----END PRIVATE KEY-----\n';

    const publicKeyPEM =
      '-----BEGIN PUBLIC KEY-----\n' +
      'MCowBQYDK2VwAyEA4XtDjXsod4rV6687R6kn6/PkccsZCX1AYaXgVmH7AVs=\n' +
      '-----END PUBLIC KEY-----\n';

    // prettier-ignore
    const oldPrivateKey = new Uint8Array([
      92,  85,  34,  21, 229, 142, 168,  76, 221, 116,  56,
      193, 153, 129,  32, 198, 125,  90, 231, 143, 220, 220,
      158,  37, 196, 198,  34, 177, 100, 221, 229, 228, 225,
      123,  67, 141, 123,  40, 119, 138, 213, 235, 175,  59,
      71, 169,  39, 235, 243, 228, 113, 203,  25,   9, 125,
      64,  97, 165, 224,  86,  97, 251,   1,  91
    ])

    const keyPair = Ed25519.parseKeyPair(publicKey, privateKey);
    const keyPairFromPEM = Ed25519.parseKeyPair(
      Ed25519.parsePublicKey(Ed25519.readBase64WithPEM(publicKeyPEM)),
      Ed25519.parsePrivateKey(Ed25519.readBase64WithPEM(privateKeyPEM))
    );

    const spy = sinon.spy(console, 'warn');

    const oldKeyPair = new Ed25519(publicKey, oldPrivateKey);

    expect(keyPair.privateKey).deep.equal(keyPairFromPEM.privateKey);
    expect(oldKeyPair.privateKey).deep.equal(keyPairFromPEM.privateKey);

    expect(spy.calledOnce).true;

    spy.restore();
  });

  it('should throw error when public key and private key are mismatched', () => {
    const badFn = () =>
      Ed25519.parseKeyPair(new Uint8Array(publicKey).reverse(), privateKey);

    expect(badFn).to.throw('Invalid key pairs');
  });

  it('should generate r+s signature', () => {
    const signKeyPair = Ed25519.new();
    const message = Uint8Array.from(Buffer.from('Hello Ed25519'));

    const signature = signKeyPair.sign(message);

    expect(signature.length).to.equal(64);
  });

  it('should sign and verify message', () => {
    const signKeyPair = Ed25519.new();
    const message = Uint8Array.from(Buffer.from('Hello Ed25519'));

    const signature = signKeyPair.sign(message);

    expect(signKeyPair.verify(signature, message)).to.equal(true);
  });

  it('should generate hex string of public key', () => {
    const publicKeyHexString = Ed25519.accountHex(publicKey);

    expect(publicKeyHexString).to.eq(
      '01e17b438d7b28778ad5ebaf3b47a927ebf3e471cb19097d4061a5e05661fb015b'
    );
  });

  it('should compute hex from PublicKey correctly', () => {
    const ed25519Account = Ed25519.new();
    const ed25519AccountHex = ed25519Account.accountHex();
    expect(CLPublicKey.fromHex(ed25519AccountHex)).to.deep.equal(
      ed25519Account.publicKey
    );
  });
});
