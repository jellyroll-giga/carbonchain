import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StellarService } from '../stellar/stellar.service';
import { StellarKeypairService } from '../stellar/stellar-keypair.service';
import { nativeToScVal, scValToNative } from '@stellar/stellar-sdk';
import { Offer } from '../../../shared';

export class CreateOfferDto {
  sellerPublicKey: string;
  creditId: string;   // hex BytesN<32>
  priceXlm: string;   // stroops as string
  tonnes: string;     // i128 as string
}

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);
  private readonly contractId: string;

  constructor(
    private readonly stellarService: StellarService,
    private readonly keypairService: StellarKeypairService,
    private readonly configService: ConfigService,
  ) {
    this.contractId = this.configService.get<string>('MARKETPLACE_CONTRACT_ID', '');
  }

  async createOffer(dto: CreateOfferDto): Promise<{ offerId: string }> {
    this.logger.log(`Creating offer for credit ${dto.creditId}`);
    const args = [
      nativeToScVal(dto.sellerPublicKey, { type: 'address' }),
      nativeToScVal(Buffer.from(dto.creditId, 'hex'), { type: 'bytes' }),
      nativeToScVal(BigInt(dto.priceXlm), { type: 'i128' }),
      nativeToScVal(BigInt(dto.tonnes), { type: 'i128' }),
    ];
    const signer = this.keypairService.getAdminKeypair();
    const response = await this.stellarService.invokeContract(
      this.contractId, 'create_offer', args, signer,
    );
    const offerId = (response as any).returnValue
      ? String(scValToNative((response as any).returnValue))
      : 'unknown';
    return { offerId };
  }

  async getOffer(offerId: number): Promise<Offer> {
    const args = [nativeToScVal(offerId, { type: 'u64' })];
    const retval = await this.stellarService.readContract(this.contractId, 'get_offer', args);
    if (!retval) throw new NotFoundException(`Offer ${offerId} not found`);
    return this.mapOffer(offerId, scValToNative(retval) as any);
  }

  async getOffersBySeller(seller: string): Promise<string[]> {
    const args = [nativeToScVal(seller, { type: 'address' })];
    const retval = await this.stellarService.readContract(
      this.contractId, 'get_offers_by_seller', args,
    );
    if (!retval) return [];
    return (scValToNative(retval) as bigint[]).map(String);
  }

  async cancelOffer(seller: string, offerId: number): Promise<void> {
    const args = [
      nativeToScVal(seller, { type: 'address' }),
      nativeToScVal(offerId, { type: 'u64' }),
    ];
    const signer = this.keypairService.getAdminKeypair();
    await this.stellarService.invokeContract(this.contractId, 'cancel_offer', args, signer);
  }

  private mapOffer(id: number, n: any): Offer {
    return {
      id: String(id),
      seller: n.seller.toString(),
      credit_id: Buffer.from(n.credit_id as Uint8Array).toString('hex'),
      price_xlm: n.price_xlm.toString(),
      tonnes_available: n.tonnes.toString(),
      created_at: Number(n.created_at),
      status: n.active ? 'open' : 'cancelled',
    };
  }
}
