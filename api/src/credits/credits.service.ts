import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StellarService } from '../stellar/stellar.service';
import { StellarKeypairService } from '../stellar/stellar-keypair.service';
import { xdr, scValToNative, nativeToScVal } from '@stellar/stellar-sdk';
import { CreditMetadata, CreditStatus } from '../shared';

export class IssueCreditDto {
  issuerPublicKey: string;
  projectId: string;
  vintageYear: number;
  methodology: string;
  geography: string;
  tonnes: string;   // i128 as string
  ipfsHash: string;
}

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);
  private readonly contractId: string;

  constructor(
    private stellarService: StellarService,
    private configService: ConfigService,
    private keypairService: StellarKeypairService,
  ) {
    this.contractId = this.configService.get<string>('CREDIT_REGISTRY_CONTRACT_ID') || '';
  }

  async issueCredit(dto: IssueCreditDto): Promise<{ creditId: string }> {
    this.logger.log(`Issuing credit for project ${dto.projectId}`);
    const args = [
      nativeToScVal(dto.issuerPublicKey, { type: 'address' }),
      nativeToScVal(dto.projectId, { type: 'string' }),
      nativeToScVal(dto.vintageYear, { type: 'u32' }),
      nativeToScVal(dto.methodology, { type: 'string' }),
      nativeToScVal(dto.geography, { type: 'string' }),
      nativeToScVal(BigInt(dto.tonnes), { type: 'i128' }),
      nativeToScVal(dto.ipfsHash, { type: 'string' }),
    ];
    const signer = this.keypairService.getAdminKeypair();
    const response = await this.stellarService.invokeContract(
      this.contractId, 'submit_credit', args, signer,
    );
    const creditId = (response as any).returnValue
      ? Buffer.from(scValToNative((response as any).returnValue) as Uint8Array).toString('hex')
      : 'unknown';
    return { creditId };
  }

  async getCredit(creditId: string): Promise<CreditMetadata> {
    try {
      this.logger.log(`Fetching credit metadata for ID: ${creditId}`);
      
      const args = [nativeToScVal(Buffer.from(creditId, 'hex'), { type: 'bytes' })];
      const retval = await this.stellarService.readContract(this.contractId, 'get_credit', args);
      
      if (!retval) {
        throw new NotFoundException(`Credit with ID ${creditId} not found on-chain`);
      }

      const native = scValToNative(retval);
      return this.mapToCreditMetadata(creditId, native);
    } catch (error) {
      this.logger.error(`Failed to fetch credit ${creditId}: ${error.message}`);
      throw error;
    }
  }

  async listCreditsByProject(projectId: string): Promise<string[]> {
    try {
      this.logger.log(`Listing credits for project: ${projectId}`);
      
      const args = [nativeToScVal(projectId, { type: 'string' })];
      const retval = await this.stellarService.readContract(this.contractId, 'list_credits_by_project', args);
      
      if (!retval) {
        return [];
      }

      const native = scValToNative(retval) as Buffer[];
      return native.map(buf => buf.toString('hex'));
    } catch (error) {
      this.logger.error(`Failed to list credits for project ${projectId}: ${error.message}`);
      return [];
    }
  }

  private mapToCreditMetadata(id: string, native: any): CreditMetadata {
    return {
      id,
      project_id: native.project_id.toString(),
      issuer: native.issuer.toString(), // Address to string
      vintage_year: Number(native.vintage_year),
      methodology: native.methodology.toString(),
      geography: native.geography.toString(),
      tonnes: native.tonnes.toString(), // i128 to string
      ipfs_hash: native.ipfs_hash.toString(),
      status: native.status as CreditStatus,
      issued_at: Number(native.issued_at),
    };
  }
}
