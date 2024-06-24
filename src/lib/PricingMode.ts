import { concat } from '@ethersproject/bytes';
import { Err, Ok } from 'ts-results';
import { toBytesString, toBytesU64, toBytesU8 } from './ByteConverters';

import { jsonMember, jsonObject } from 'typedjson';
import { CLErrorCodes, ToBytesResult } from '.';

@jsonObject
export class PricingModeClassic {
  @jsonMember({
    name: 'payment_amount',
    constructor: Number
  })
  public paymentAmount: number;
  @jsonMember({
    name: 'gas_price_tolerance',
    constructor: Number
  })
  public gasPriceTolerance: number;
  @jsonMember({
    name: 'standard_payment',
    constructor: Boolean
  })
  public standardPayment: boolean;

  public toBytes(): ToBytesResult {
    return Ok(
      concat([
        toBytesU8(CLASSIC_TAG),
        toBytesU64(this.paymentAmount),
        toBytesU8(this.gasPriceTolerance),
        toBytesU8(this.standardPayment ? 1 : 0)
      ])
    );
  }
}

@jsonObject
export class PricingModeFixed {
  @jsonMember({
    name: 'gas_price_tolerance',
    constructor: Number
  })
  public gasPriceTolerance: number;
  public toBytes(): ToBytesResult {
    return Ok(
      concat([toBytesU8(FIXED_TAG), toBytesU8(this.gasPriceTolerance)])
    );
  }
}

@jsonObject
export class PricingModeReserved {
  @jsonMember({ constructor: String })
  receipt: string;
  public toBytes(): ToBytesResult {
    return Ok(concat([toBytesU8(RESERVED_TAG), toBytesString(this.receipt)]));
  }
}

const CLASSIC_TAG = 0;
const FIXED_TAG = 1;
const RESERVED_TAG = 2;

@jsonObject
export class PricingMode {
  @jsonMember({
    constructor: PricingModeClassic
  })
  public Classic?: PricingModeClassic;
  @jsonMember({
    constructor: PricingModeFixed
  })
  public Fixed?: PricingModeFixed;

  @jsonMember({
    constructor: PricingModeReserved
  })
  public Reserved?: PricingModeReserved;

  //TODO create builder methods for all variants
  public static buildClassic(
    paymentAmount: number,
    gasPriceTolerance: number,
    standardPayment = true
  ): PricingMode {
    const pm = new PricingMode();
    pm.Classic = new PricingModeClassic();
    pm.Classic.gasPriceTolerance = gasPriceTolerance;
    pm.Classic.paymentAmount = paymentAmount;
    pm.Classic.standardPayment = standardPayment;
    return pm;
  }

  public static buildFixed(gasPriceTolerance: number): PricingMode {
    const pm = new PricingMode();
    pm.Fixed = new PricingModeFixed();
    pm.Fixed.gasPriceTolerance = gasPriceTolerance;
    return pm;
  }

  public toBytes(): ToBytesResult {
    if (this.Classic) {
      return this.Classic.toBytes();
    } else if (this.Fixed) {
      return this.Fixed.toBytes();
    } else if (this.Reserved) {
      return this.Reserved.toBytes();
    }
    return Err(CLErrorCodes.UnknownValue);
  }
}
