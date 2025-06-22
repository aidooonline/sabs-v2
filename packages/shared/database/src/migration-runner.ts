import { DataSource, QueryRunner } from 'typeorm';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { createHash } from 'crypto';

export interface MigrationFile {
  version: string;
  filename: string;
  path: string;
  checksum: string;
  sql: string;
}

export interface MigrationRecord {
  version: string;
  filename: string;
  checksum: string;
  executedAt: Date;
  executionTime: number;
  success: boolean;
  errorMessage?: string;
}

export class MigrationRunner {
  private dataSource: DataSource;
  private migrationsPath: string;

  constructor(dataSource: DataSource, migrationsPath: string) {
    this.dataSource = dataSource;
    this.migrationsPath = migrationsPath;
  }

  /**
   * Initialize migration tracking table
   */
  async initialize(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS migration_history (
          id SERIAL PRIMARY KEY,
          version VARCHAR(50) NOT NULL UNIQUE,
          filename VARCHAR(255) NOT NULL,
          checksum VARCHAR(64) NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          execution_time INTEGER NOT NULL,
          success BOOLEAN NOT NULL,
          error_message TEXT,
          
          INDEX idx_migration_version (version),
          INDEX idx_migration_executed_at (executed_at)
        )
      `);
      
      console.log('✅ Migration tracking table initialized');
    } catch (error) {
      console.error('❌ Failed to initialize migration tracking:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Discover migration files
   */
  private discoverMigrations(): MigrationFile[] {
    const migrations: MigrationFile[] = [];
    
    try {
      const files = readdirSync(this.migrationsPath)
        .filter(file => extname(file) === '.sql')
        .sort(); // Ensure sequential execution

      for (const filename of files) {
        const filepath = join(this.migrationsPath, filename);
        const stat = statSync(filepath);
        
        if (stat.isFile()) {
          const sql = readFileSync(filepath, 'utf8');
          const checksum = createHash('sha256').update(sql).digest('hex');
          
          // Extract version from filename (e.g., 001-create-tables.sql -> 001)
          const versionMatch = filename.match(/^(\d+)/);
          if (!versionMatch) {
            console.warn(`⚠️ Skipping file ${filename}: Invalid filename format`);
            continue;
          }
          
          migrations.push({
            version: versionMatch[1],
            filename,
            path: filepath,
            checksum,
            sql,
          });
        }
      }
      
      return migrations;
    } catch (error) {
      console.error('❌ Failed to discover migrations:', error);
      throw error;
    }
  }

  /**
   * Get executed migrations from database
   */
  private async getExecutedMigrations(): Promise<MigrationRecord[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      const result = await queryRunner.query(`
        SELECT version, filename, checksum, executed_at, execution_time, success, error_message
        FROM migration_history
        ORDER BY version ASC
      `);
      
      return result.map((row: any) => ({
        version: row.version,
        filename: row.filename,
        checksum: row.checksum,
        executedAt: row.executed_at,
        executionTime: row.execution_time,
        success: row.success,
        errorMessage: row.error_message,
      }));
    } catch (error) {
      console.error('❌ Failed to get executed migrations:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Execute a single migration
   */
  private async executeMigration(
    migration: MigrationFile,
    queryRunner: QueryRunner,
  ): Promise<{ success: boolean; executionTime: number; errorMessage?: string }> {
    const startTime = Date.now();
    
    try {
      console.log(`🚀 Executing migration ${migration.version}: ${migration.filename}`);
      
      // Execute the migration SQL
      await queryRunner.query(migration.sql);
      
      const executionTime = Date.now() - startTime;
      console.log(`✅ Migration ${migration.version} completed in ${executionTime}ms`);
      
      return { success: true, executionTime };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.error(`❌ Migration ${migration.version} failed after ${executionTime}ms:`, errorMessage);
      
      return { success: false, executionTime, errorMessage };
    }
  }

  /**
   * Record migration execution in history
   */
  private async recordMigration(
    migration: MigrationFile,
    result: { success: boolean; executionTime: number; errorMessage?: string },
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.query(`
      INSERT INTO migration_history (version, filename, checksum, execution_time, success, error_message)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      migration.version,
      migration.filename,
      migration.checksum,
      result.executionTime,
      result.success,
      result.errorMessage || null,
    ]);
  }

  /**
   * Run pending migrations
   */
  async migrate(): Promise<{ executed: number; failed: number }> {
    await this.initialize();
    
    const allMigrations = this.discoverMigrations();
    const executedMigrations = await this.getExecutedMigrations();
    const executedVersions = new Set(executedMigrations.map(m => m.version));
    
    console.log(`📊 Found ${allMigrations.length} total migrations, ${executedMigrations.length} already executed`);
    
    // Verify checksum integrity for executed migrations
    for (const executed of executedMigrations) {
      const current = allMigrations.find(m => m.version === executed.version);
      if (current && current.checksum !== executed.checksum) {
        throw new Error(
          `Migration integrity error: ${executed.filename} has been modified since execution. ` +
          `Expected checksum: ${executed.checksum}, Current: ${current.checksum}`
        );
      }
    }
    
    // Find pending migrations
    const pendingMigrations = allMigrations.filter(m => !executedVersions.has(m.version));
    
    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return { executed: 0, failed: 0 };
    }
    
    console.log(`🔄 Executing ${pendingMigrations.length} pending migrations...`);
    
    let executed = 0;
    let failed = 0;
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
      for (const migration of pendingMigrations) {
        // Start transaction for this migration
        await queryRunner.startTransaction();
        
        try {
          const result = await this.executeMigration(migration, queryRunner);
          await this.recordMigration(migration, result, queryRunner);
          
          if (result.success) {
            await queryRunner.commitTransaction();
            executed++;
          } else {
            await queryRunner.rollbackTransaction();
            failed++;
            
            // Stop on first failure
            console.error(`💥 Migration failed, stopping execution`);
            break;
          }
        } catch (error) {
          await queryRunner.rollbackTransaction();
          failed++;
          
          console.error(`💥 Transaction failed for migration ${migration.version}:`, error);
          break;
        }
      }
    } finally {
      await queryRunner.release();
    }
    
    console.log(`📊 Migration summary: ${executed} executed, ${failed} failed`);
    
    if (failed > 0) {
      throw new Error(`Migration failed. ${executed} migrations executed successfully, ${failed} failed.`);
    }
    
    return { executed, failed };
  }

  /**
   * Get migration status
   */
  async status(): Promise<{
    total: number;
    executed: number;
    pending: number;
    migrations: Array<{
      version: string;
      filename: string;
      status: 'executed' | 'pending' | 'modified';
      executedAt?: Date;
      executionTime?: number;
    }>;
  }> {
    const allMigrations = this.discoverMigrations();
    const executedMigrations = await this.getExecutedMigrations();
    const executedMap = new Map(executedMigrations.map(m => [m.version, m]));
    
    const migrations = allMigrations.map(migration => {
      const executed = executedMap.get(migration.version);
      
      if (!executed) {
        return {
          version: migration.version,
          filename: migration.filename,
          status: 'pending' as const,
        };
      }
      
      const status = executed.checksum === migration.checksum ? 'executed' as const : 'modified' as const;
      
      return {
        version: migration.version,
        filename: migration.filename,
        status,
        executedAt: executed.executedAt,
        executionTime: executed.executionTime,
      };
    });
    
    return {
      total: allMigrations.length,
      executed: executedMigrations.length,
      pending: allMigrations.length - executedMigrations.length,
      migrations,
    };
  }

  /**
   * Validate migration integrity
   */
  async validate(): Promise<boolean> {
    try {
      const status = await this.status();
      const modified = status.migrations.filter(m => m.status === 'modified');
      
      if (modified.length > 0) {
        console.error('❌ Migration integrity violations:');
        modified.forEach(m => {
          console.error(`  - ${m.filename} has been modified since execution`);
        });
        return false;
      }
      
      console.log('✅ All migrations passed integrity validation');
      return true;
    } catch (error) {
      console.error('❌ Migration validation failed:', error);
      return false;
    }
  }
}