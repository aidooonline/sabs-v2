#!/usr/bin/env ts-node

import { createConnection, Connection } from 'mysql2/promise';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

interface LegacyConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

interface ExtractionResult {
  table: string;
  totalRecords: number;
  extractedRecords: number;
  filePath: string;
  checksum: string;
  extractedAt: Date;
}

interface LegacyCompany {
  id: number;
  company_name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
  status: number;
}

interface LegacyUser {
  id: number;
  company_id: number;
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
  agent_code?: string;
  created_at: string;
  status: number;
}

interface LegacyCustomer {
  id: number;
  company_id: number;
  customer_number: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  balance: number;
  created_by: number;
  created_at: string;
  status: number;
}

interface LegacyTransaction {
  id: number;
  company_id: number;
  customer_id: number;
  agent_id: number;
  transaction_type: string;
  amount: number;
  fee: number;
  commission: number;
  balance_before: number;
  balance_after: number;
  reference: string;
  description?: string;
  status: string;
  created_at: string;
}

export class LegacyDataExtractor {
  private connection: Connection;
  private outputDir: string;
  private batchSize: number;

  constructor(config: LegacyConfig, outputDir: string = './data-migration/extracted', batchSize: number = 1000) {
    this.outputDir = outputDir;
    this.batchSize = batchSize;
    
    // Ensure output directory exists
    mkdirSync(this.outputDir, { recursive: true });
  }

  async connect(config: LegacyConfig): Promise<void> {
    try {
      this.connection = await createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        charset: 'utf8mb4',
      });
      
      console.log('✅ Connected to legacy database');
    } catch (error) {
      console.error('❌ Failed to connect to legacy database:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      console.log('✅ Disconnected from legacy database');
    }
  }

  private async extractTable<T>(
    tableName: string,
    query: string,
    transformer?: (row: any) => T
  ): Promise<ExtractionResult> {
    console.log(`🔄 Extracting data from ${tableName}...`);
    
    const startTime = Date.now();
    const extractedAt = new Date();
    
    try {
      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM (${query}) as count_table`;
      const [countResult] = await this.connection.execute(countQuery);
      const totalRecords = (countResult as any)[0].total;
      
      console.log(`📊 Found ${totalRecords} records in ${tableName}`);
      
      if (totalRecords === 0) {
        console.log(`⚠️ No data found in ${tableName}, skipping...`);
        return {
          table: tableName,
          totalRecords: 0,
          extractedRecords: 0,
          filePath: '',
          checksum: '',
          extractedAt,
        };
      }
      
      const allData: T[] = [];
      let offset = 0;
      let extractedRecords = 0;
      
      // Extract in batches
      while (offset < totalRecords) {
        const batchQuery = `${query} LIMIT ${this.batchSize} OFFSET ${offset}`;
        const [rows] = await this.connection.execute(batchQuery);
        
        const batchData = transformer 
          ? (rows as any[]).map(transformer)
          : (rows as T[]);
        
        allData.push(...batchData);
        extractedRecords += batchData.length;
        offset += this.batchSize;
        
        const progress = Math.round((extractedRecords / totalRecords) * 100);
        console.log(`📈 Progress: ${extractedRecords}/${totalRecords} (${progress}%)`);
      }
      
      // Write to file
      const fileName = `${tableName}_${extractedAt.toISOString().slice(0, 10)}.json`;
      const filePath = join(this.outputDir, fileName);
      const jsonData = JSON.stringify(allData, null, 2);
      
      writeFileSync(filePath, jsonData);
      
      // Calculate checksum
      const checksum = createHash('sha256').update(jsonData).digest('hex');
      
      const executionTime = Date.now() - startTime;
      console.log(`✅ Extracted ${extractedRecords} records from ${tableName} in ${executionTime}ms`);
      console.log(`📁 Saved to: ${filePath}`);
      console.log(`🔒 Checksum: ${checksum.slice(0, 16)}...`);
      
      return {
        table: tableName,
        totalRecords,
        extractedRecords,
        filePath,
        checksum,
        extractedAt,
      };
      
    } catch (error) {
      console.error(`❌ Failed to extract ${tableName}:`, error);
      throw error;
    }
  }

  async extractCompanies(): Promise<ExtractionResult> {
    const query = `
      SELECT 
        id,
        company_name,
        email,
        phone,
        address,
        created_at,
        status
      FROM companies 
      WHERE status != 'deleted'
      ORDER BY id
    `;
    
    const transformer = (row: any): LegacyCompany => ({
      id: row.id,
      company_name: row.company_name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      created_at: row.created_at,
      status: row.status,
    });
    
    return this.extractTable('companies', query, transformer);
  }

  async extractUsers(): Promise<ExtractionResult> {
    const query = `
      SELECT 
        u.id,
        u.company_id,
        u.name,
        u.email,
        u.password,
        u.phone,
        u.role,
        u.agent_code,
        u.created_at,
        u.status
      FROM users u
      INNER JOIN companies c ON u.company_id = c.id
      WHERE u.status != 'deleted' AND c.status != 'deleted'
      ORDER BY u.company_id, u.id
    `;
    
    const transformer = (row: any): LegacyUser => ({
      id: row.id,
      company_id: row.company_id,
      name: row.name,
      email: row.email,
      password: row.password,
      phone: row.phone,
      role: row.role,
      agent_code: row.agent_code,
      created_at: row.created_at,
      status: row.status,
    });
    
    return this.extractTable('users', query, transformer);
  }

  async extractCustomers(): Promise<ExtractionResult> {
    const query = `
      SELECT 
        c.id,
        c.company_id,
        c.customer_number,
        c.first_name,
        c.last_name,
        c.phone,
        c.email,
        c.balance,
        c.created_by,
        c.created_at,
        c.status
      FROM customers c
      INNER JOIN companies co ON c.company_id = co.id
      WHERE c.status != 'deleted' AND co.status != 'deleted'
      ORDER BY c.company_id, c.id
    `;
    
    const transformer = (row: any): LegacyCustomer => ({
      id: row.id,
      company_id: row.company_id,
      customer_number: row.customer_number,
      first_name: row.first_name,
      last_name: row.last_name,
      phone: row.phone,
      email: row.email,
      balance: parseFloat(row.balance),
      created_by: row.created_by,
      created_at: row.created_at,
      status: row.status,
    });
    
    return this.extractTable('customers', query, transformer);
  }

  async extractTransactions(): Promise<ExtractionResult> {
    const query = `
      SELECT 
        t.id,
        t.company_id,
        t.customer_id,
        t.agent_id,
        t.transaction_type,
        t.amount,
        t.fee,
        t.commission,
        t.balance_before,
        t.balance_after,
        t.reference,
        t.description,
        t.status,
        t.created_at
      FROM transactions t
      INNER JOIN companies c ON t.company_id = c.id
      WHERE t.status != 'deleted' AND c.status != 'deleted'
      ORDER BY t.company_id, t.created_at
    `;
    
    const transformer = (row: any): LegacyTransaction => ({
      id: row.id,
      company_id: row.company_id,
      customer_id: row.customer_id,
      agent_id: row.agent_id,
      transaction_type: row.transaction_type,
      amount: parseFloat(row.amount),
      fee: parseFloat(row.fee || 0),
      commission: parseFloat(row.commission || 0),
      balance_before: parseFloat(row.balance_before),
      balance_after: parseFloat(row.balance_after),
      reference: row.reference,
      description: row.description,
      status: row.status,
      created_at: row.created_at,
    });
    
    return this.extractTable('transactions', query, transformer);
  }

  async extractAll(): Promise<ExtractionResult[]> {
    console.log('🚀 Starting full data extraction from legacy system...');
    
    const results: ExtractionResult[] = [];
    
    try {
      // Extract in dependency order
      results.push(await this.extractCompanies());
      results.push(await this.extractUsers());
      results.push(await this.extractCustomers());
      results.push(await this.extractTransactions());
      
      // Generate extraction manifest
      const manifest = {
        extractedAt: new Date(),
        totalTables: results.length,
        totalRecords: results.reduce((sum, r) => sum + r.extractedRecords, 0),
        results,
      };
      
      const manifestPath = join(this.outputDir, 'extraction-manifest.json');
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      
      console.log('📋 Extraction manifest saved to:', manifestPath);
      console.log('🎉 Data extraction completed successfully!');
      console.log(`📊 Total records extracted: ${manifest.totalRecords}`);
      
      return results;
      
    } catch (error) {
      console.error('💥 Data extraction failed:', error);
      throw error;
    }
  }

  async validateExtraction(): Promise<boolean> {
    console.log('🔍 Validating extracted data...');
    
    try {
      // Check extraction manifest exists
      const manifestPath = join(this.outputDir, 'extraction-manifest.json');
      
      try {
        const manifestData = require(manifestPath);
        console.log('✅ Extraction manifest found');
        console.log(`📊 Manifest shows ${manifestData.totalRecords} total records`);
        
        // Validate each extracted file
        for (const result of manifestData.results) {
          if (result.extractedRecords === 0) {
            console.log(`⚠️ ${result.table}: No records (this may be expected)`);
            continue;
          }
          
          try {
            const data = require(result.filePath);
            if (data.length !== result.extractedRecords) {
              console.error(`❌ ${result.table}: Record count mismatch`);
              return false;
            }
            console.log(`✅ ${result.table}: ${result.extractedRecords} records validated`);
          } catch (error) {
            console.error(`❌ ${result.table}: Failed to read extracted file`);
            return false;
          }
        }
        
        console.log('✅ All extracted data validated successfully');
        return true;
        
      } catch (error) {
        console.error('❌ Extraction manifest not found or invalid');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      return false;
    }
  }
}

// CLI interface
async function main() {
  if (process.argv.length < 3) {
    console.log(`
Usage: ts-node legacy-extractor.ts <command> [options]

Commands:
  extract     Extract all data from legacy system
  validate    Validate extracted data
  
Environment variables:
  LEGACY_DB_HOST     Legacy database host
  LEGACY_DB_PORT     Legacy database port  
  LEGACY_DB_USER     Legacy database user
  LEGACY_DB_PASSWORD Legacy database password
  LEGACY_DB_NAME     Legacy database name
  OUTPUT_DIR         Output directory for extracted data
`);
    process.exit(1);
  }

  const command = process.argv[2];
  
  const config: LegacyConfig = {
    host: process.env.LEGACY_DB_HOST || 'localhost',
    port: parseInt(process.env.LEGACY_DB_PORT || '3306'),
    user: process.env.LEGACY_DB_USER || 'root',
    password: process.env.LEGACY_DB_PASSWORD || '',
    database: process.env.LEGACY_DB_NAME || 'sabs_legacy',
  };
  
  const outputDir = process.env.OUTPUT_DIR || './data-migration/extracted';
  const extractor = new LegacyDataExtractor(config, outputDir);
  
  try {
    switch (command) {
      case 'extract':
        await extractor.connect(config);
        await extractor.extractAll();
        break;
        
      case 'validate':
        const isValid = await extractor.validateExtraction();
        process.exit(isValid ? 0 : 1);
        break;
        
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('💥 Operation failed:', error);
    process.exit(1);
  } finally {
    await extractor.disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}