import { jsonObject, jsonMember } from 'typedjson';
import { concat } from '@ethersproject/bytes';

import { CLValueString } from './clvalue';

/**
 * Enum representing the available transaction entry points, each representing a different operation in the system.
 */
export enum TransactionEntryPointEnum {
  Custom = 'Custom',
  Transfer = 'Transfer',
  AddBid = 'AddBid',
  WithdrawBid = 'WithdrawBid',
  Delegate = 'Delegate',
  Undelegate = 'Undelegate',
  Redelegate = 'Redelegate',
  ActivateBid = 'ActivateBid',
  ChangeBidPublicKey = 'ChangeBidPublicKey',
  Call = 'Call'
}

/**
 * Enum representing the tags for different transaction entry points. This is used for efficient storage and comparison.
 */
export enum TransactionEntryPointTag {
  Custom = 0,
  Transfer,
  AddBid,
  WithdrawBid,
  Delegate,
  Undelegate,
  Redelegate,
  ActivateBid,
  ChangeBidPublicKey,
  Call
}

/**
 * Represents a transaction entry point, which can be one of several predefined actions or a custom action.
 * This class contains multiple fields that correspond to different transaction actions.
 */
@jsonObject
export class TransactionEntryPoint {
  /**
   * Custom entry point, where the value can be a string representing a custom action.
   */
  @jsonMember({ constructor: String })
  custom?: string;

  /**
   * The transfer action as a generic object.
   */
  @jsonMember({ constructor: Object })
  transfer?: Record<string, unknown>;

  /**
   * The add bid action as a generic object.
   */
  @jsonMember({ constructor: Object })
  addBid?: Record<string, unknown>;

  /**
   * The withdraw bid action as a generic object.
   */
  @jsonMember({ constructor: Object })
  withdrawBid?: Record<string, unknown>;

  /**
   * The delegate action as a generic object.
   */
  @jsonMember({ constructor: Object })
  delegate?: Record<string, unknown>;

  /**
   * The undelegate action as a generic object.
   */
  @jsonMember({ constructor: Object })
  undelegate?: Record<string, unknown>;

  /**
   * The redelegate action as a generic object.
   */
  @jsonMember({ constructor: Object })
  redelegate?: Record<string, unknown>;

  /**
   * The activate bid action as a generic object.
   */
  @jsonMember({ constructor: Object })
  activateBid?: Record<string, unknown>;

  /**
   * The change bid public key action as a generic object.
   */
  @jsonMember({ constructor: Object })
  changeBidPublicKey?: Record<string, unknown>;

  /**
   * The call action as a generic object.
   */
  @jsonMember({ constructor: Object })
  call?: Record<string, unknown>;

  /**
   * Creates a new `TransactionEntryPoint` instance, where each parameter corresponds to a specific entry point action.
   *
   * @param custom A custom entry point action represented as a string.
   * @param transfer The transfer action, represented as a generic object.
   * @param addBid The add bid action, represented as a generic object.
   * @param withdrawBid The withdraw bid action, represented as a generic object.
   * @param delegate The delegate action, represented as a generic object.
   * @param undelegate The undelegate action, represented as a generic object.
   * @param redelegate The redelegate action, represented as a generic object.
   * @param activateBid The activate bid action, represented as a generic object.
   * @param changeBidPublicKey The change bid public key action, represented as a generic object.
   * @param call The call action, represented as a generic object.
   */
  constructor(
    custom?: string,
    transfer?: Record<string, unknown>,
    addBid?: Record<string, unknown>,
    withdrawBid?: Record<string, unknown>,
    delegate?: Record<string, unknown>,
    undelegate?: Record<string, unknown>,
    redelegate?: Record<string, unknown>,
    activateBid?: Record<string, unknown>,
    changeBidPublicKey?: Record<string, unknown>,
    call?: Record<string, unknown>
  ) {
    this.custom = custom;
    this.transfer = transfer;
    this.addBid = addBid;
    this.withdrawBid = withdrawBid;
    this.delegate = delegate;
    this.undelegate = undelegate;
    this.redelegate = redelegate;
    this.activateBid = activateBid;
    this.changeBidPublicKey = changeBidPublicKey;
    this.call = call;
  }

  /**
   * Returns the tag corresponding to the transaction entry point. This helps identify the entry point in a compact manner.
   *
   * @returns The tag number associated with the entry point.
   */
  private tag(): number {
    if (this.transfer) return TransactionEntryPointTag.Transfer;
    if (this.addBid) return TransactionEntryPointTag.AddBid;
    if (this.withdrawBid) return TransactionEntryPointTag.WithdrawBid;
    if (this.delegate) return TransactionEntryPointTag.Delegate;
    if (this.undelegate) return TransactionEntryPointTag.Undelegate;
    if (this.redelegate) return TransactionEntryPointTag.Redelegate;
    if (this.activateBid) return TransactionEntryPointTag.ActivateBid;
    if (this.changeBidPublicKey)
      return TransactionEntryPointTag.ChangeBidPublicKey;
    if (this.call) return TransactionEntryPointTag.Call;
    return TransactionEntryPointTag.Custom;
  }

  /**
   * Serializes the transaction entry point into a byte array.
   *
   * @returns A `Uint8Array` representing the transaction entry point and any associated data.
   */
  bytes(): Uint8Array {
    let result = new Uint8Array([this.tag()]);
    if (this.custom) {
      const customBytes = new CLValueString(this.custom).bytes();
      result = concat([result, customBytes]);
    }
    return result;
  }

  /**
   * Converts the transaction entry point to a JSON-compatible format.
   *
   * @returns A JSON-compatible representation of the transaction entry point.
   * @throws An error if the entry point is unknown.
   */
  toJSON(): unknown {
    if (this.custom) {
      return { Custom: this.custom };
    }

    if (this.transfer) return TransactionEntryPointEnum.Transfer;
    if (this.addBid) return TransactionEntryPointEnum.AddBid;
    if (this.withdrawBid) return TransactionEntryPointEnum.WithdrawBid;
    if (this.delegate) return TransactionEntryPointEnum.Delegate;
    if (this.undelegate) return TransactionEntryPointEnum.Undelegate;
    if (this.redelegate) return TransactionEntryPointEnum.Redelegate;
    if (this.activateBid) return TransactionEntryPointEnum.ActivateBid;
    if (this.changeBidPublicKey)
      return TransactionEntryPointEnum.ChangeBidPublicKey;
    if (this.call) return TransactionEntryPointEnum.Call;

    throw new Error('Unknown entry point');
  }

  /**
   * Creates a `TransactionEntryPoint` instance from a JSON representation.
   *
   * @param json The JSON representation of the entry point.
   * @returns A `TransactionEntryPoint` instance.
   * @throws An error if the entry point is unknown.
   */
  static fromJSON(json: any): TransactionEntryPoint {
    const entryPoint = new TransactionEntryPoint();
    if (json instanceof Object && json.Custom) {
      entryPoint.custom = json.Custom;
      return entryPoint;
    }

    switch (json) {
      case TransactionEntryPointEnum.Transfer:
        entryPoint.transfer = {};
        break;
      case TransactionEntryPointEnum.AddBid:
        entryPoint.addBid = {};
        break;
      case TransactionEntryPointEnum.WithdrawBid:
        entryPoint.withdrawBid = {};
        break;
      case TransactionEntryPointEnum.Delegate:
        entryPoint.delegate = {};
        break;
      case TransactionEntryPointEnum.Undelegate:
        entryPoint.undelegate = {};
        break;
      case TransactionEntryPointEnum.Redelegate:
        entryPoint.redelegate = {};
        break;
      case TransactionEntryPointEnum.ActivateBid:
        entryPoint.activateBid = {};
        break;
      case TransactionEntryPointEnum.ChangeBidPublicKey:
        entryPoint.changeBidPublicKey = {};
        break;
      case TransactionEntryPointEnum.Call:
        entryPoint.call = {};
        break;
      default:
        throw new Error('Unknown entry point');
    }

    return entryPoint;
  }
}
