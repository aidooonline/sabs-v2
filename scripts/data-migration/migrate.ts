#!/usr/bin/env ts-node

import { LegacyDataExtractor } from './legacy-extractor';
import { DataTransformer } from './data-transformer';
import { DataLoader } from './data-loader';
import { MigrationRunner } from '../../packages/shared/database/src/migration-runner';
import { DataSource } from 'typeorm';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface MigrationConfig {
  // Legacy database connection
  legacyDb: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  
  // New database connection
  newDb: {
    url: string;
  };
  
  // Directories
  workingDir: string;
  extractDir: string;
  transformDir: string;
  
  // Options
  batchSize: number;
  validateOnly: boolean;
  dryRun: boolean;
  skipExtraction: boolean;
  skipTransformation: boolean;
  skipLoading: boolean;
}

interface MigrationResult {
  success: boolean;
  startTime: Date;
  endTime: Date;
  duration: number;
  phases: {
    extraction: PhaseResult;
    transformation: PhaseResult;
    loading: PhaseResult;
    validation: PhaseResult;
  };
  summary: {
    totalRecordsExtracted: number;
    totalRecordsTransformed: number;
    totalRecordsLoaded: number;
    totalErrors: number;
  };
  errors: string[];
}

interface PhaseResult {
  success: boolean;
  startTime: Date;
  endTime: Date;
  duration: number;
  details: any;
  errors: string[];
}

export class MigrationOrchestrator {
  private config: MigrationConfig;
  private dataSource: DataSource;
  private migrationResult: MigrationResult;

  constructor(config: MigrationConfig) {
    this.config = config;
    
    // Initialize data source
    this.dataSource = new DataSource({
      type: 'postgres',
      url: config.newDb.url,
      entities: [],
      synchronize: false,
      logging: false,
    });
    
    // Initialize result tracking
    this.migrationResult = {
      success: false,
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      phases: {
        extraction: this.createEmptyPhaseResult(),
        transformation: this.createEmptyPhaseResult(),
        loading: this.createEmptyPhaseResult(),
        validation: this.createEmptyPhaseResult(),
      },
      summary: {
        totalRecordsExtracted: 0,
        totalRecordsTransformed: 0,
        totalRecordsLoaded: 0,
        totalErrors: 0,
      },
      errors: [],
    };
  }

  private createEmptyPhaseResult(): PhaseResult {
    return {
      success: false,
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      details: {},
      errors: [],
    };
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
    console.log(`${timestamp} ${prefix} ${message}`);
  }

  private async ensureDirectories(): Promise<void> {
    try {
      mkdirSync(this.config.workingDir, { recursive: true });
      mkdirSync(this.config.extractDir, { recursive: true });
      mkdirSync(this.config.transformDir, { recursive: true });
      
      this.log(`Created working directories`);
    } catch (error) {
      throw new Error(`Failed to create directories: ${error}`);
    }
  }

  async runSchemaMigrations(): Promise<void> {
    this.log('🔄 Running database schema migrations...');
    
    try {
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
      }
      
      const migrationRunner = new MigrationRunner(
        this.dataSource,
        join(__dirname, '../../packages/shared/database/src/migrations')
      );
      
      const result = await migrationRunner.migrate();
      
      if (result.failed > 0) {
        throw new Error(`${result.failed} migrations failed`);
      }
      
      this.log(`✅ Successfully executed ${result.executed} schema migrations`);
    } catch (error) {
      throw new Error(`Schema migration failed: ${error}`);
    }
  }

  async runDataExtraction(): Promise<PhaseResult> {
    const phase = this.migrationResult.phases.extraction;
    phase.startTime = new Date();
    
    this.log('🔄 Starting data extraction phase...');
    
    try {
      const extractor = new LegacyDataExtractor(
        this.config.legacyDb,
        this.config.extractDir,
        this.config.batchSize
      );
      
      if (this.config.dryRun) {
        this.log('📋 DRY RUN: Skipping actual extraction');
        phase.success = true;
        phase.details = { dryRun: true };
      } else {
        await extractor.connect(this.config.legacyDb);
        const results = await extractor.extractAll();
        await extractor.disconnect();
        
        phase.details = results;
        this.migrationResult.summary.totalRecordsExtracted = results.reduce(
          (sum, r) => sum + r.extractedRecords, 0
        );
        
        // Validate extraction
        const isValid = await extractor.validateExtraction();
        if (!isValid) {
          throw new Error('Data extraction validation failed');
        }
        
        phase.success = true;
        this.log(`✅ Data extraction completed: ${this.migrationResult.summary.totalRecordsExtracted} records`);
      }
    } catch (error) {
      phase.errors.push(error instanceof Error ? error.message : String(error));
      this.migrationResult.errors.push(`Extraction failed: ${error}`);
      throw error;
    } finally {
      phase.endTime = new Date();
      phase.duration = phase.endTime.getTime() - phase.startTime.getTime();
    }
    
    return phase;
  }

  async runDataTransformation(): Promise<PhaseResult> {
    const phase = this.migrationResult.phases.transformation;
    phase.startTime = new Date();
    
    this.log('🔄 Starting data transformation phase...');
    
    try {
      const transformer = new DataTransformer(
        this.config.extractDir,
        this.config.transformDir
      );
      
      if (this.config.dryRun) {
        this.log('📋 DRY RUN: Skipping actual transformation');
        phase.success = true;
        phase.details = { dryRun: true };
      } else {
        const results = await transformer.transformAll();
        
        phase.details = results;
        this.migrationResult.summary.totalRecordsTransformed = results.reduce(
          (sum, r) => sum + r.outputRecords, 0
        );
        
        // Validate transformation
        const isValid = await transformer.validateTransformation();
        if (!isValid) {
          throw new Error('Data transformation validation failed');
        }
        
        phase.success = true;
        this.log(`✅ Data transformation completed: ${this.migrationResult.summary.totalRecordsTransformed} records`);
      }
    } catch (error) {
      phase.errors.push(error instanceof Error ? error.message : String(error));
      this.migrationResult.errors.push(`Transformation failed: ${error}`);
      throw error;
    } finally {
      phase.endTime = new Date();
      phase.duration = phase.endTime.getTime() - phase.startTime.getTime();
    }
    
    return phase;
  }

  async runDataLoading(): Promise<PhaseResult> {
    const phase = this.migrationResult.phases.loading;
    phase.startTime = new Date();
    
    this.log('🔄 Starting data loading phase...');
    
    try {
      const loader = new DataLoader(
        this.dataSource,
        this.config.transformDir,
        this.config.batchSize
      );
      
      if (this.config.dryRun) {
        this.log('📋 DRY RUN: Skipping actual data loading');
        phase.success = true;
        phase.details = { dryRun: true };
      } else {
        const results = await loader.loadAll();
        
        phase.details = results;
        this.migrationResult.summary.totalRecordsLoaded = results.reduce(
          (sum, r) => sum + r.recordsLoaded, 0
        );
        
        const totalFailed = results.reduce((sum, r) => sum + r.recordsFailed, 0);
        this.migrationResult.summary.totalErrors += totalFailed;
        
        // Validate loading
        const isValid = await loader.validateLoad();
        if (!isValid) {
          throw new Error('Data loading validation failed');
        }
        
        phase.success = true;
        this.log(`✅ Data loading completed: ${this.migrationResult.summary.totalRecordsLoaded} records loaded`);
        
        if (totalFailed > 0) {
          this.log(`⚠️ ${totalFailed} records failed to load`, 'warn');
        }
      }
    } catch (error) {
      phase.errors.push(error instanceof Error ? error.message : String(error));
      this.migrationResult.errors.push(`Loading failed: ${error}`);
      throw error;
    } finally {
      phase.endTime = new Date();
      phase.duration = phase.endTime.getTime() - phase.startTime.getTime();
    }
    
    return phase;
  }

  async runValidation(): Promise<PhaseResult> {
    const phase = this.migrationResult.phases.validation;
    phase.startTime = new Date();
    
    this.log('🔄 Starting final validation phase...');
    
    try {
      if (this.config.dryRun) {
        this.log('📋 DRY RUN: Skipping validation');
        phase.success = true;
        phase.details = { dryRun: true };
      } else {
        // Run comprehensive validation
        const loader = new DataLoader(this.dataSource, this.config.transformDir);
        const isValid = await loader.validateLoad();
        
        if (!isValid) {
          throw new Error('Final validation failed');
        }
        
        phase.success = true;
        phase.details = { validationPassed: true };
        this.log('✅ Final validation completed successfully');
      }
    } catch (error) {
      phase.errors.push(error instanceof Error ? error.message : String(error));
      this.migrationResult.errors.push(`Validation failed: ${error}`);
      throw error;
    } finally {
      phase.endTime = new Date();
      phase.duration = phase.endTime.getTime() - phase.startTime.getTime();
    }
    
    return phase;
  }

  async runFullMigration(): Promise<MigrationResult> {
    this.log('🚀 Starting Sabs v2 data migration...');
    this.migrationResult.startTime = new Date();
    
    try {
      // Ensure working directories exist
      await this.ensureDirectories();
      
      // Run schema migrations first
      await this.runSchemaMigrations();
      
      // Phase 1: Data Extraction
      if (!this.config.skipExtraction) {
        await this.runDataExtraction();
      } else {
        this.log('⏭️ Skipping data extraction phase');
      }
      
      // Phase 2: Data Transformation
      if (!this.config.skipTransformation) {
        await this.runDataTransformation();
      } else {
        this.log('⏭️ Skipping data transformation phase');
      }
      
      // Phase 3: Data Loading
      if (!this.config.skipLoading) {
        await this.runDataLoading();
      } else {
        this.log('⏭️ Skipping data loading phase');
      }
      
      // Phase 4: Final Validation
      await this.runValidation();
      
      // Mark as successful if we reach here
      this.migrationResult.success = true;
      
      this.log('🎉 Migration completed successfully!');
      
    } catch (error) {
      this.migrationResult.success = false;
      this.log(`💥 Migration failed: ${error}`, 'error');
    } finally {
      this.migrationResult.endTime = new Date();
      this.migrationResult.duration = this.migrationResult.endTime.getTime() - this.migrationResult.startTime.getTime();
      
      // Save migration report
      await this.saveMigrationReport();
      
      // Close database connection
      if (this.dataSource.isInitialized) {
        await this.dataSource.destroy();
      }
    }
    
    return this.migrationResult;
  }

  private async saveMigrationReport(): Promise<void> {
    try {
      const reportPath = join(this.config.workingDir, 'migration-report.json');
      const report = {
        ...this.migrationResult,
        config: {
          ...this.config,
          legacyDb: { ...this.config.legacyDb, password: '[REDACTED]' },
        },
        generatedAt: new Date().toISOString(),
      };
      
      writeFileSync(reportPath, JSON.stringify(report, null, 2));
      this.log(`📋 Migration report saved: ${reportPath}`);
    } catch (error) {
      this.log(`Failed to save migration report: ${error}`, 'error');
    }
  }

  printSummary(): void {
    const { success, duration, summary, phases } = this.migrationResult;
    
    console.log('\n' + '='.repeat(60));
    console.log('              MIGRATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`Status: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Duration: ${Math.round(duration / 1000)}s`);
    console.log(`\nRecords:`);
    console.log(`  Extracted: ${summary.totalRecordsExtracted.toLocaleString()}`);
    console.log(`  Transformed: ${summary.totalRecordsTransformed.toLocaleString()}`);
    console.log(`  Loaded: ${summary.totalRecordsLoaded.toLocaleString()}`);
    console.log(`  Errors: ${summary.totalErrors.toLocaleString()}`);
    
    console.log(`\nPhase Details:`);
    Object.entries(phases).forEach(([phase, result]) => {
      const status = result.success ? '✅' : '❌';
      const duration = Math.round(result.duration / 1000);
      console.log(`  ${phase}: ${status} (${duration}s)`);
    });
    
    if (this.migrationResult.errors.length > 0) {
      console.log(`\nErrors:`);
      this.migrationResult.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }
    
    console.log('='.repeat(60) + '\n');
  }
}

// CLI interface
async function main() {
  if (process.argv.length < 3) {
    console.log(`
Usage: ts-node migrate.ts <command> [options]

Commands:
  full         Run complete migration (extract → transform → load)
  extract      Run extraction phase only
  transform    Run transformation phase only
  load         Run loading phase only
  validate     Run validation only
  schema       Run schema migrations only
  
Options:
  --dry-run           Simulate migration without making changes
  --validate-only     Run validation checks only
  --skip-extraction   Skip data extraction phase
  --skip-transform    Skip data transformation phase  
  --skip-loading      Skip data loading phase
  --batch-size=N      Batch size for processing (default: 1000)
  --working-dir=PATH  Working directory (default: ./data-migration)

Environment variables:
  LEGACY_DB_HOST      Legacy database host
  LEGACY_DB_PORT      Legacy database port
  LEGACY_DB_USER      Legacy database user
  LEGACY_DB_PASSWORD  Legacy database password
  LEGACY_DB_NAME      Legacy database name
  DATABASE_URL        New database connection string
`);
    process.exit(1);
  }

  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  // Parse command line options
  const options = {
    dryRun: args.includes('--dry-run'),
    validateOnly: args.includes('--validate-only'),
    skipExtraction: args.includes('--skip-extraction'),
    skipTransformation: args.includes('--skip-transform'),
    skipLoading: args.includes('--skip-loading'),
    batchSize: parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '1000'),
    workingDir: args.find(arg => arg.startsWith('--working-dir='))?.split('=')[1] || './data-migration',
  };
  
  // Build configuration
  const config: MigrationConfig = {
    legacyDb: {
      host: process.env.LEGACY_DB_HOST || 'localhost',
      port: parseInt(process.env.LEGACY_DB_PORT || '3306'),
      user: process.env.LEGACY_DB_USER || 'root',
      password: process.env.LEGACY_DB_PASSWORD || '',
      database: process.env.LEGACY_DB_NAME || 'sabs_legacy',
    },
    newDb: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/sabs_v2',
    },
    workingDir: options.workingDir,
    extractDir: join(options.workingDir, 'extracted'),
    transformDir: join(options.workingDir, 'transformed'),
    batchSize: options.batchSize,
    validateOnly: options.validateOnly,
    dryRun: options.dryRun,
    skipExtraction: options.skipExtraction,
    skipTransformation: options.skipTransformation,
    skipLoading: options.skipLoading,
  };
  
  const orchestrator = new MigrationOrchestrator(config);
  
  try {
    let result: MigrationResult;
    
    switch (command) {
      case 'full':
        result = await orchestrator.runFullMigration();
        break;
        
      case 'extract':
        await orchestrator.runDataExtraction();
        result = orchestrator.migrationResult;
        break;
        
      case 'transform':
        await orchestrator.runDataTransformation();
        result = orchestrator.migrationResult;
        break;
        
      case 'load':
        await orchestrator.runDataLoading();
        result = orchestrator.migrationResult;
        break;
        
      case 'validate':
        await orchestrator.runValidation();
        result = orchestrator.migrationResult;
        break;
        
      case 'schema':
        await orchestrator.runSchemaMigrations();
        result = orchestrator.migrationResult;
        break;
        
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
    
    orchestrator.printSummary();
    process.exit(result.success ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    orchestrator.printSummary();
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}