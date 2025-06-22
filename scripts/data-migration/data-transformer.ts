#!/usr/bin/env ts-node

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

interface TransformationResult {
  table: string;
  inputRecords: number;
  outputRecords: number;
  skippedRecords: number;
  errorRecords: number;
  filePath: string;
  checksum: string;
  transformedAt: Date;
  errors: Array<{
    record: any;
    error: string;
  }>;
}

interface Sabs2Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  country_code: string;
  currency: string;
  timezone: string;
  status: 'active' | 'inactive' | 'suspended' | 'trial';
  settings: object;
  subscription_plan: string;
  trial_ends_at?: string;
  sms_credits: number;
  ai_credits: number;
  commission_rates: object;
  created_at: string;
  updated_at: string;
}

interface Sabs2User {
  id: string;
  company_id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'super_admin' | 'company_admin' | 'clerk' | 'field_agent';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  agent_code?: string;
  location?: object;
  email_verified_at?: string;
  last_login_at?: string;
  login_attempts: number;
  locked_until?: string;
  created_at: string;
  updated_at: string;
}

interface Sabs2Customer {
  id: string;
  company_id: string;
  customer_number: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  id_type?: string;
  id_number?: string;
  kyc_status: string;
  kyc_verified_at?: string;
  kyc_documents: any[];
  balance: number;
  account_status: string;
  created_by_agent_id?: string;
  created_at: string;
  updated_at: string;
}

interface Sabs2Transaction {
  id: string;
  company_id: string;
  reference: string;
  customer_id: string;
  agent_id: string;
  type: 'deposit' | 'withdrawal' | 'commission' | 'reversal' | 'fee';
  amount: number;
  fee: number;
  commission: number;
  status: 'pending' | 'completed' | 'failed' | 'reversed' | 'cancelled';
  description?: string;
  balance_before: number;
  balance_after: number;
  location?: object;
  device_info?: object;
  approved_by_user_id?: string;
  approved_at?: string;
  reversed_transaction_id?: string;
  reversal_reason?: string;
  created_at: string;
  updated_at: string;
}

export class DataTransformer {
  private inputDir: string;
  private outputDir: string;
  private legacyIdMappings: Map<string, Map<number, string>> = new Map();

  constructor(
    inputDir: string = './data-migration/extracted',
    outputDir: string = './data-migration/transformed'
  ) {
    this.inputDir = inputDir;
    this.outputDir = outputDir;
    
    // Ensure output directory exists
    mkdirSync(this.outputDir, { recursive: true });
    
    // Initialize ID mapping storage
    this.legacyIdMappings.set('companies', new Map());
    this.legacyIdMappings.set('users', new Map());
    this.legacyIdMappings.set('customers', new Map());
    this.legacyIdMappings.set('transactions', new Map());
  }

  private generateNewId(): string {
    return uuidv4();
  }

  private mapLegacyId(table: string, legacyId: number): string {
    const mapping = this.legacyIdMappings.get(table);
    if (!mapping) {
      throw new Error(`No mapping found for table: ${table}`);
    }

    let newId = mapping.get(legacyId);
    if (!newId) {
      newId = this.generateNewId();
      mapping.set(legacyId, newId);
    }
    
    return newId;
  }

  private formatDateTime(dateString: string): string {
    try {
      return new Date(dateString).toISOString();
    } catch (error) {
      return new Date().toISOString(); // Fallback to current time
    }
  }

  private async hashPassword(password: string): Promise<string> {
    // For migration, we'll need to rehash all passwords
    // In a real scenario, you might want to force password resets instead
    return await bcrypt.hash(password, 12);
  }

  private mapLegacyRole(legacyRole: string): 'super_admin' | 'company_admin' | 'clerk' | 'field_agent' {
    const roleMapping: Record<string, 'super_admin' | 'company_admin' | 'clerk' | 'field_agent'> = {
      'super_admin': 'super_admin',
      'admin': 'company_admin',
      'company_admin': 'company_admin',
      'clerk': 'clerk',
      'teller': 'clerk',
      'agent': 'field_agent',
      'field_agent': 'field_agent',
    };
    
    return roleMapping[legacyRole.toLowerCase()] || 'field_agent';
  }

  private mapLegacyStatus(legacyStatus: number): 'active' | 'inactive' | 'suspended' | 'pending' {
    // Assuming legacy status: 1 = active, 0 = inactive, -1 = suspended
    switch (legacyStatus) {
      case 1: return 'active';
      case 0: return 'inactive';
      case -1: return 'suspended';
      default: return 'pending';
    }
  }

  private mapTransactionType(legacyType: string): 'deposit' | 'withdrawal' | 'commission' | 'reversal' | 'fee' {
    const typeMapping: Record<string, 'deposit' | 'withdrawal' | 'commission' | 'reversal' | 'fee'> = {
      'deposit': 'deposit',
      'credit': 'deposit',
      'withdrawal': 'withdrawal',
      'debit': 'withdrawal',
      'commission': 'commission',
      'reversal': 'reversal',
      'reverse': 'reversal',
      'fee': 'fee',
      'charge': 'fee',
    };
    
    return typeMapping[legacyType.toLowerCase()] || 'deposit';
  }

  private mapTransactionStatus(legacyStatus: string): 'pending' | 'completed' | 'failed' | 'reversed' | 'cancelled' {
    const statusMapping: Record<string, 'pending' | 'completed' | 'failed' | 'reversed' | 'cancelled'> = {
      'pending': 'pending',
      'processing': 'pending',
      'completed': 'completed',
      'success': 'completed',
      'successful': 'completed',
      'failed': 'failed',
      'error': 'failed',
      'reversed': 'reversed',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
    };
    
    return statusMapping[legacyStatus.toLowerCase()] || 'pending';
  }

  async transformCompanies(): Promise<TransformationResult> {
    console.log('🔄 Transforming companies...');
    
    const inputFile = join(this.inputDir, 'companies_2024-01-01.json'); // Adjust date as needed
    const outputFile = join(this.outputDir, 'companies.json');
    
    try {
      const legacyData = JSON.parse(readFileSync(inputFile, 'utf8'));
      const transformedData: Sabs2Company[] = [];
      const errors: Array<{ record: any; error: string }> = [];
      let skippedRecords = 0;

      for (const record of legacyData) {
        try {
          const newId = this.mapLegacyId('companies', record.id);
          
          const transformed: Sabs2Company = {
            id: newId,
            name: record.company_name,
            email: record.email,
            phone: record.phone || undefined,
            address: record.address || undefined,
            country_code: 'GH', // Default to Ghana
            currency: 'GHS',
            timezone: 'Africa/Accra',
            status: this.mapLegacyStatus(record.status) as any,
            settings: {},
            subscription_plan: 'basic',
            trial_ends_at: undefined,
            sms_credits: 1000, // Default credits
            ai_credits: 500,
            commission_rates: {
              deposit: 0.02,
              withdrawal: 0.03,
            },
            created_at: this.formatDateTime(record.created_at),
            updated_at: this.formatDateTime(record.created_at),
          };

          transformedData.push(transformed);
        } catch (error) {
          errors.push({
            record,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Write transformed data
      const jsonData = JSON.stringify(transformedData, null, 2);
      writeFileSync(outputFile, jsonData);
      
      const checksum = createHash('sha256').update(jsonData).digest('hex');

      return {
        table: 'companies',
        inputRecords: legacyData.length,
        outputRecords: transformedData.length,
        skippedRecords,
        errorRecords: errors.length,
        filePath: outputFile,
        checksum,
        transformedAt: new Date(),
        errors,
      };

    } catch (error) {
      throw new Error(`Failed to transform companies: ${error}`);
    }
  }

  async transformUsers(): Promise<TransformationResult> {
    console.log('🔄 Transforming users...');
    
    const inputFile = join(this.inputDir, 'users_2024-01-01.json');
    const outputFile = join(this.outputDir, 'users.json');
    
    try {
      const legacyData = JSON.parse(readFileSync(inputFile, 'utf8'));
      const transformedData: Sabs2User[] = [];
      const errors: Array<{ record: any; error: string }> = [];
      let skippedRecords = 0;

      for (const record of legacyData) {
        try {
          const newId = this.mapLegacyId('users', record.id);
          const companyId = this.legacyIdMappings.get('companies')?.get(record.company_id);
          
          if (!companyId) {
            skippedRecords++;
            console.warn(`⚠️ Skipping user ${record.id}: Company ${record.company_id} not found`);
            continue;
          }

          // Split name into first and last name
          const nameParts = record.name.trim().split(' ');
          const firstName = nameParts[0] || 'Unknown';
          const lastName = nameParts.slice(1).join(' ') || 'User';

          const transformed: Sabs2User = {
            id: newId,
            company_id: companyId,
            email: record.email,
            password_hash: await this.hashPassword(record.password),
            first_name: firstName,
            last_name: lastName,
            phone: record.phone || undefined,
            role: this.mapLegacyRole(record.role),
            status: this.mapLegacyStatus(record.status),
            agent_code: record.agent_code || undefined,
            location: undefined,
            email_verified_at: undefined,
            last_login_at: undefined,
            login_attempts: 0,
            locked_until: undefined,
            created_at: this.formatDateTime(record.created_at),
            updated_at: this.formatDateTime(record.created_at),
          };

          transformedData.push(transformed);
        } catch (error) {
          errors.push({
            record,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Write transformed data
      const jsonData = JSON.stringify(transformedData, null, 2);
      writeFileSync(outputFile, jsonData);
      
      const checksum = createHash('sha256').update(jsonData).digest('hex');

      return {
        table: 'users',
        inputRecords: legacyData.length,
        outputRecords: transformedData.length,
        skippedRecords,
        errorRecords: errors.length,
        filePath: outputFile,
        checksum,
        transformedAt: new Date(),
        errors,
      };

    } catch (error) {
      throw new Error(`Failed to transform users: ${error}`);
    }
  }

  async transformCustomers(): Promise<TransformationResult> {
    console.log('🔄 Transforming customers...');
    
    const inputFile = join(this.inputDir, 'customers_2024-01-01.json');
    const outputFile = join(this.outputDir, 'customers.json');
    
    try {
      const legacyData = JSON.parse(readFileSync(inputFile, 'utf8'));
      const transformedData: Sabs2Customer[] = [];
      const errors: Array<{ record: any; error: string }> = [];
      let skippedRecords = 0;

      for (const record of legacyData) {
        try {
          const newId = this.mapLegacyId('customers', record.id);
          const companyId = this.legacyIdMappings.get('companies')?.get(record.company_id);
          const createdByAgentId = this.legacyIdMappings.get('users')?.get(record.created_by);
          
          if (!companyId) {
            skippedRecords++;
            console.warn(`⚠️ Skipping customer ${record.id}: Company ${record.company_id} not found`);
            continue;
          }

          const transformed: Sabs2Customer = {
            id: newId,
            company_id: companyId,
            customer_number: record.customer_number,
            first_name: record.first_name,
            last_name: record.last_name,
            phone: record.phone,
            email: record.email || undefined,
            date_of_birth: undefined,
            gender: undefined,
            address: undefined,
            id_type: undefined,
            id_number: undefined,
            kyc_status: 'pending',
            kyc_verified_at: undefined,
            kyc_documents: [],
            balance: record.balance,
            account_status: this.mapLegacyStatus(record.status),
            created_by_agent_id: createdByAgentId || undefined,
            created_at: this.formatDateTime(record.created_at),
            updated_at: this.formatDateTime(record.created_at),
          };

          transformedData.push(transformed);
        } catch (error) {
          errors.push({
            record,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Write transformed data
      const jsonData = JSON.stringify(transformedData, null, 2);
      writeFileSync(outputFile, jsonData);
      
      const checksum = createHash('sha256').update(jsonData).digest('hex');

      return {
        table: 'customers',
        inputRecords: legacyData.length,
        outputRecords: transformedData.length,
        skippedRecords,
        errorRecords: errors.length,
        filePath: outputFile,
        checksum,
        transformedAt: new Date(),
        errors,
      };

    } catch (error) {
      throw new Error(`Failed to transform customers: ${error}`);
    }
  }

  async transformTransactions(): Promise<TransformationResult> {
    console.log('🔄 Transforming transactions...');
    
    const inputFile = join(this.inputDir, 'transactions_2024-01-01.json');
    const outputFile = join(this.outputDir, 'transactions.json');
    
    try {
      const legacyData = JSON.parse(readFileSync(inputFile, 'utf8'));
      const transformedData: Sabs2Transaction[] = [];
      const errors: Array<{ record: any; error: string }> = [];
      let skippedRecords = 0;

      for (const record of legacyData) {
        try {
          const newId = this.mapLegacyId('transactions', record.id);
          const companyId = this.legacyIdMappings.get('companies')?.get(record.company_id);
          const customerId = this.legacyIdMappings.get('customers')?.get(record.customer_id);
          const agentId = this.legacyIdMappings.get('users')?.get(record.agent_id);
          
          if (!companyId || !customerId || !agentId) {
            skippedRecords++;
            console.warn(`⚠️ Skipping transaction ${record.id}: Missing references`);
            continue;
          }

          const transformed: Sabs2Transaction = {
            id: newId,
            company_id: companyId,
            reference: record.reference,
            customer_id: customerId,
            agent_id: agentId,
            type: this.mapTransactionType(record.transaction_type),
            amount: record.amount,
            fee: record.fee,
            commission: record.commission,
            status: this.mapTransactionStatus(record.status),
            description: record.description || undefined,
            balance_before: record.balance_before,
            balance_after: record.balance_after,
            location: undefined,
            device_info: undefined,
            approved_by_user_id: undefined,
            approved_at: undefined,
            reversed_transaction_id: undefined,
            reversal_reason: undefined,
            created_at: this.formatDateTime(record.created_at),
            updated_at: this.formatDateTime(record.created_at),
          };

          transformedData.push(transformed);
        } catch (error) {
          errors.push({
            record,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Write transformed data
      const jsonData = JSON.stringify(transformedData, null, 2);
      writeFileSync(outputFile, jsonData);
      
      const checksum = createHash('sha256').update(jsonData).digest('hex');

      return {
        table: 'transactions',
        inputRecords: legacyData.length,
        outputRecords: transformedData.length,
        skippedRecords,
        errorRecords: errors.length,
        filePath: outputFile,
        checksum,
        transformedAt: new Date(),
        errors,
      };

    } catch (error) {
      throw new Error(`Failed to transform transactions: ${error}`);
    }
  }

  async transformAll(): Promise<TransformationResult[]> {
    console.log('🚀 Starting data transformation...');
    
    const results: TransformationResult[] = [];
    
    try {
      // Transform in dependency order
      results.push(await this.transformCompanies());
      results.push(await this.transformUsers());
      results.push(await this.transformCustomers());
      results.push(await this.transformTransactions());
      
      // Save ID mappings for reference
      const mappingData = {
        companies: Object.fromEntries(this.legacyIdMappings.get('companies') || []),
        users: Object.fromEntries(this.legacyIdMappings.get('users') || []),
        customers: Object.fromEntries(this.legacyIdMappings.get('customers') || []),
        transactions: Object.fromEntries(this.legacyIdMappings.get('transactions') || []),
      };
      
      const mappingPath = join(this.outputDir, 'id-mappings.json');
      writeFileSync(mappingPath, JSON.stringify(mappingData, null, 2));
      
      // Generate transformation manifest
      const manifest = {
        transformedAt: new Date(),
        totalTables: results.length,
        totalInputRecords: results.reduce((sum, r) => sum + r.inputRecords, 0),
        totalOutputRecords: results.reduce((sum, r) => sum + r.outputRecords, 0),
        totalSkippedRecords: results.reduce((sum, r) => sum + r.skippedRecords, 0),
        totalErrorRecords: results.reduce((sum, r) => sum + r.errorRecords, 0),
        results,
      };
      
      const manifestPath = join(this.outputDir, 'transformation-manifest.json');
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      
      console.log('📋 Transformation manifest saved to:', manifestPath);
      console.log('🆔 ID mappings saved to:', mappingPath);
      console.log('🎉 Data transformation completed successfully!');
      console.log(`📊 Total records: ${manifest.totalInputRecords} → ${manifest.totalOutputRecords}`);
      console.log(`⚠️ Skipped: ${manifest.totalSkippedRecords}, Errors: ${manifest.totalErrorRecords}`);
      
      return results;
      
    } catch (error) {
      console.error('💥 Data transformation failed:', error);
      throw error;
    }
  }

  async validateTransformation(): Promise<boolean> {
    console.log('🔍 Validating transformed data...');
    
    try {
      const manifestPath = join(this.outputDir, 'transformation-manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      
      console.log('✅ Transformation manifest found');
      console.log(`📊 Manifest shows ${manifest.totalOutputRecords} total output records`);
      
      // Validate each transformed file
      for (const result of manifest.results) {
        if (result.outputRecords === 0) {
          console.log(`⚠️ ${result.table}: No output records`);
          continue;
        }
        
        try {
          const data = JSON.parse(readFileSync(result.filePath, 'utf8'));
          if (data.length !== result.outputRecords) {
            console.error(`❌ ${result.table}: Record count mismatch`);
            return false;
          }
          
          // Basic validation of first record structure
          if (data.length > 0) {
            const firstRecord = data[0];
            if (!firstRecord.id || !firstRecord.created_at || !firstRecord.updated_at) {
              console.error(`❌ ${result.table}: Missing required fields in transformed data`);
              return false;
            }
          }
          
          console.log(`✅ ${result.table}: ${result.outputRecords} records validated`);
        } catch (error) {
          console.error(`❌ ${result.table}: Failed to read transformed file`);
          return false;
        }
      }
      
      console.log('✅ All transformed data validated successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Transformation validation failed:', error);
      return false;
    }
  }
}

// CLI interface
async function main() {
  if (process.argv.length < 3) {
    console.log(`
Usage: ts-node data-transformer.ts <command> [options]

Commands:
  transform   Transform all extracted data to Sabs v2 format
  validate    Validate transformed data
  
Environment variables:
  INPUT_DIR   Input directory with extracted data
  OUTPUT_DIR  Output directory for transformed data
`);
    process.exit(1);
  }

  const command = process.argv[2];
  
  const inputDir = process.env.INPUT_DIR || './data-migration/extracted';
  const outputDir = process.env.OUTPUT_DIR || './data-migration/transformed';
  
  const transformer = new DataTransformer(inputDir, outputDir);
  
  try {
    switch (command) {
      case 'transform':
        await transformer.transformAll();
        break;
        
      case 'validate':
        const isValid = await transformer.validateTransformation();
        process.exit(isValid ? 0 : 1);
        break;
        
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('💥 Operation failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}