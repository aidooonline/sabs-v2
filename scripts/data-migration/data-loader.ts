#!/usr/bin/env ts-node

import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';

interface LoadResult {
  table: string;
  recordsToLoad: number;
  recordsLoaded: number;
  recordsFailed: number;
  loadedAt: Date;
  errors: Array<{
    record: any;
    error: string;
  }>;
}

interface LoadManifest {
  loadedAt: Date;
  totalTables: number;
  totalRecords: number;
  totalLoaded: number;
  totalFailed: number;
  results: LoadResult[];
}

export class DataLoader {
  private dataSource: DataSource;
  private inputDir: string;
  private batchSize: number;

  constructor(
    dataSource: DataSource,
    inputDir: string = './data-migration/transformed',
    batchSize: number = 500
  ) {
    this.dataSource = dataSource;
    this.inputDir = inputDir;
    this.batchSize = batchSize;
  }

  private async loadTable(
    tableName: string,
    data: any[],
    queryRunner: QueryRunner
  ): Promise<LoadResult> {
    console.log(`🔄 Loading ${data.length} records into ${tableName}...`);
    
    const startTime = Date.now();
    const errors: Array<{ record: any; error: string }> = [];
    let recordsLoaded = 0;
    let recordsFailed = 0;

    // Process in batches to avoid memory issues
    for (let i = 0; i < data.length; i += this.batchSize) {
      const batch = data.slice(i, i + this.batchSize);
      
      try {
        await queryRunner.startTransaction();
        
        for (const record of batch) {
          try {
            // Build INSERT query dynamically
            const columns = Object.keys(record);
            const values = Object.values(record);
            const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
            
            const query = `
              INSERT INTO ${tableName} (${columns.join(', ')})
              VALUES (${placeholders})
              ON CONFLICT (id) DO UPDATE SET
                ${columns.map(col => `${col} = EXCLUDED.${col}`).join(', ')},
                updated_at = CURRENT_TIMESTAMP
            `;
            
            await queryRunner.query(query, values);
            recordsLoaded++;
            
          } catch (error) {
            recordsFailed++;
            errors.push({
              record,
              error: error instanceof Error ? error.message : String(error),
            });
            
            // Continue with other records in the batch
            console.warn(`⚠️ Failed to load record: ${error}`);
          }
        }
        
        await queryRunner.commitTransaction();
        
        const progress = Math.round(((i + batch.length) / data.length) * 100);
        console.log(`📈 Progress: ${i + batch.length}/${data.length} (${progress}%)`);
        
      } catch (error) {
        await queryRunner.rollbackTransaction();
        console.error(`❌ Batch failed for ${tableName}:`, error);
        
        // Mark all records in this batch as failed
        recordsFailed += batch.length;
        for (const record of batch) {
          errors.push({
            record,
            error: `Batch transaction failed: ${error}`,
          });
        }
      }
    }
    
    const executionTime = Date.now() - startTime;
    console.log(`✅ Loaded ${recordsLoaded}/${data.length} records into ${tableName} in ${executionTime}ms`);
    
    if (recordsFailed > 0) {
      console.warn(`⚠️ ${recordsFailed} records failed to load into ${tableName}`);
    }

    return {
      table: tableName,
      recordsToLoad: data.length,
      recordsLoaded,
      recordsFailed,
      loadedAt: new Date(),
      errors,
    };
  }

  async loadCompanies(): Promise<LoadResult> {
    const filePath = join(this.inputDir, 'companies.json');
    const data = JSON.parse(readFileSync(filePath, 'utf8'));
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
      return await this.loadTable('companies', data, queryRunner);
    } finally {
      await queryRunner.release();
    }
  }

  async loadUsers(): Promise<LoadResult> {
    const filePath = join(this.inputDir, 'users.json');
    const data = JSON.parse(readFileSync(filePath, 'utf8'));
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
      return await this.loadTable('users', data, queryRunner);
    } finally {
      await queryRunner.release();
    }
  }

  async loadCustomers(): Promise<LoadResult> {
    const filePath = join(this.inputDir, 'customers.json');
    const data = JSON.parse(readFileSync(filePath, 'utf8'));
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
      return await this.loadTable('customers', data, queryRunner);
    } finally {
      await queryRunner.release();
    }
  }

  async loadTransactions(): Promise<LoadResult> {
    const filePath = join(this.inputDir, 'transactions.json');
    const data = JSON.parse(readFileSync(filePath, 'utf8'));
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
      return await this.loadTable('transactions', data, queryRunner);
    } finally {
      await queryRunner.release();
    }
  }

  async loadAll(): Promise<LoadResult[]> {
    console.log('🚀 Starting data loading into Sabs v2 database...');
    
    const results: LoadResult[] = [];
    
    try {
      // Ensure database connection is established
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
      }
      
      // Load in dependency order
      console.log('📊 Loading companies...');
      results.push(await this.loadCompanies());
      
      console.log('👥 Loading users...');
      results.push(await this.loadUsers());
      
      console.log('🙋 Loading customers...');
      results.push(await this.loadCustomers());
      
      console.log('💰 Loading transactions...');
      results.push(await this.loadTransactions());
      
      // Generate load manifest
      const manifest: LoadManifest = {
        loadedAt: new Date(),
        totalTables: results.length,
        totalRecords: results.reduce((sum, r) => sum + r.recordsToLoad, 0),
        totalLoaded: results.reduce((sum, r) => sum + r.recordsLoaded, 0),
        totalFailed: results.reduce((sum, r) => sum + r.recordsFailed, 0),
        results,
      };
      
      // Save manifest
      const manifestPath = join(this.inputDir, 'load-manifest.json');
      const fs = require('fs');
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      
      console.log('📋 Load manifest saved to:', manifestPath);
      console.log('🎉 Data loading completed!');
      console.log(`📊 Total: ${manifest.totalRecords} records, ${manifest.totalLoaded} loaded, ${manifest.totalFailed} failed`);
      
      if (manifest.totalFailed > 0) {
        console.warn(`⚠️ ${manifest.totalFailed} records failed to load. Check the manifest for details.`);
      }
      
      return results;
      
    } catch (error) {
      console.error('💥 Data loading failed:', error);
      throw error;
    }
  }

  async validateLoad(): Promise<boolean> {
    console.log('🔍 Validating loaded data...');
    
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      
      try {
        // Check record counts
        const tables = ['companies', 'users', 'customers', 'transactions'];
        
        for (const table of tables) {
          const result = await queryRunner.query(`SELECT COUNT(*) as count FROM ${table}`);
          const count = parseInt(result[0].count);
          
          console.log(`📊 ${table}: ${count} records in database`);
          
          if (count === 0) {
            console.warn(`⚠️ ${table} is empty - this may be expected for a fresh migration`);
          }
        }
        
        // Check referential integrity
        console.log('🔗 Checking referential integrity...');
        
        // Check users have valid company references
        const orphanedUsers = await queryRunner.query(`
          SELECT COUNT(*) as count 
          FROM users u 
          LEFT JOIN companies c ON u.company_id = c.id 
          WHERE c.id IS NULL
        `);
        
        if (parseInt(orphanedUsers[0].count) > 0) {
          console.error(`❌ Found ${orphanedUsers[0].count} users with invalid company references`);
          return false;
        }
        
        // Check customers have valid company references
        const orphanedCustomers = await queryRunner.query(`
          SELECT COUNT(*) as count 
          FROM customers cu 
          LEFT JOIN companies c ON cu.company_id = c.id 
          WHERE c.id IS NULL
        `);
        
        if (parseInt(orphanedCustomers[0].count) > 0) {
          console.error(`❌ Found ${orphanedCustomers[0].count} customers with invalid company references`);
          return false;
        }
        
        // Check transactions have valid references
        const orphanedTransactions = await queryRunner.query(`
          SELECT COUNT(*) as count 
          FROM transactions t 
          LEFT JOIN companies c ON t.company_id = c.id 
          LEFT JOIN customers cu ON t.customer_id = cu.id 
          LEFT JOIN users u ON t.agent_id = u.id 
          WHERE c.id IS NULL OR cu.id IS NULL OR u.id IS NULL
        `);
        
        if (parseInt(orphanedTransactions[0].count) > 0) {
          console.error(`❌ Found ${orphanedTransactions[0].count} transactions with invalid references`);
          return false;
        }
        
        console.log('✅ All referential integrity checks passed');
        
        // Check data consistency
        console.log('🔄 Checking data consistency...');
        
        // Check that all UUIDs are valid format
        const invalidUuids = await queryRunner.query(`
          SELECT 'companies' as table_name, id FROM companies WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          UNION ALL
          SELECT 'users' as table_name, id FROM users WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          UNION ALL
          SELECT 'customers' as table_name, id FROM customers WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          UNION ALL
          SELECT 'transactions' as table_name, id FROM transactions WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        `);
        
        if (invalidUuids.length > 0) {
          console.error(`❌ Found ${invalidUuids.length} records with invalid UUID format`);
          invalidUuids.forEach((row: any) => {
            console.error(`  - ${row.table_name}: ${row.id}`);
          });
          return false;
        }
        
        console.log('✅ All data consistency checks passed');
        console.log('✅ Data validation completed successfully');
        
        return true;
        
      } finally {
        await queryRunner.release();
      }
      
    } catch (error) {
      console.error('❌ Data validation failed:', error);
      return false;
    }
  }

  async createBackup(backupName?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = backupName || `sabs-v2-backup-${timestamp}.sql`;
    
    console.log(`💾 Creating database backup: ${backupFileName}`);
    
    try {
      // This would typically use pg_dump for PostgreSQL
      // For now, we'll create a logical backup using SQL exports
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      
      try {
        const tables = ['companies', 'users', 'customers', 'transactions'];
        let backupContent = '';
        
        backupContent += '-- Sabs v2 Database Backup\n';
        backupContent += `-- Created: ${new Date().toISOString()}\n`;
        backupContent += '-- This is a logical backup of data only\n\n';
        
        for (const table of tables) {
          backupContent += `-- Table: ${table}\n`;
          
          const rows = await queryRunner.query(`SELECT * FROM ${table} ORDER BY created_at`);
          
          if (rows.length > 0) {
            const columns = Object.keys(rows[0]);
            backupContent += `TRUNCATE TABLE ${table} CASCADE;\n`;
            
            for (const row of rows) {
              const values = columns.map(col => {
                const value = row[col];
                if (value === null) return 'NULL';
                if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
                if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
                return String(value);
              });
              
              backupContent += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
            }
          }
          
          backupContent += '\n';
        }
        
        const fs = require('fs');
        const backupPath = join(this.inputDir, backupFileName);
        fs.writeFileSync(backupPath, backupContent);
        
        console.log(`✅ Backup created: ${backupPath}`);
        return backupPath;
        
      } finally {
        await queryRunner.release();
      }
      
    } catch (error) {
      console.error('❌ Backup creation failed:', error);
      throw error;
    }
  }

  async restoreFromBackup(backupPath: string): Promise<void> {
    console.log(`🔄 Restoring from backup: ${backupPath}`);
    
    try {
      const fs = require('fs');
      const backupContent = fs.readFileSync(backupPath, 'utf8');
      
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      
      try {
        await queryRunner.startTransaction();
        
        // Split backup into individual statements
        const statements = backupContent
          .split('\n')
          .filter(line => line.trim() && !line.startsWith('--'))
          .join('\n')
          .split(';')
          .filter(stmt => stmt.trim());
        
        for (const statement of statements) {
          if (statement.trim()) {
            await queryRunner.query(statement.trim());
          }
        }
        
        await queryRunner.commitTransaction();
        console.log('✅ Backup restored successfully');
        
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
      
    } catch (error) {
      console.error('❌ Backup restoration failed:', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  if (process.argv.length < 3) {
    console.log(`
Usage: ts-node data-loader.ts <command> [options]

Commands:
  load       Load all transformed data into Sabs v2 database
  validate   Validate loaded data integrity
  backup     Create a database backup
  restore    Restore from backup file
  
Environment variables:
  DATABASE_URL   PostgreSQL connection string for Sabs v2
  INPUT_DIR      Input directory with transformed data
`);
    process.exit(1);
  }

  const command = process.argv[2];
  
  // Create database connection
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/sabs_v2',
    entities: [], // We'll use raw SQL for migration
    synchronize: false,
    logging: false,
  });
  
  const inputDir = process.env.INPUT_DIR || './data-migration/transformed';
  const loader = new DataLoader(dataSource, inputDir);
  
  try {
    switch (command) {
      case 'load':
        await loader.loadAll();
        break;
        
      case 'validate':
        const isValid = await loader.validateLoad();
        process.exit(isValid ? 0 : 1);
        break;
        
      case 'backup':
        const backupName = process.argv[3];
        await loader.createBackup(backupName);
        break;
        
      case 'restore':
        const backupPath = process.argv[3];
        if (!backupPath) {
          console.error('❌ Please provide backup file path');
          process.exit(1);
        }
        await loader.restoreFromBackup(backupPath);
        break;
        
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('💥 Operation failed:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}