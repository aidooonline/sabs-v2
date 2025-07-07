# Company Service TypeORM Type Error Fix

## Issue Description
The `@sabs/company-service` package was failing during the build step due to TypeScript type errors related to TypeORM's `FindOneOptions<Company>` type usage. The specific errors included:

1. **Missing `id` property**: TypeScript couldn't find the `id` property on the `Company` entity
2. **Missing `createdAt` property**: TypeScript couldn't find the `createdAt` property for date range queries
3. **Import error**: The `@sabs/database` module couldn't be resolved
4. **FindOptionsWhere type errors**: Properties were not recognized as valid for `FindOptionsWhere<Company>`

## Root Cause
The `Company` entity was inheriting from `BaseEntity` imported from `@sabs/database`, which:
1. Included a `companyId` field that doesn't make sense for Company entities (companies shouldn't reference themselves)
2. Was not properly built/available, causing import resolution issues
3. Created confusion in the TypeScript type system about what properties were available

## Solution Applied

### 1. Updated Company Entity Definition
Modified `packages/services/company-service/src/companies/entities/company.entity.ts`:

**Before:**
```typescript
import { BaseEntity } from '@sabs/database';

@Entity('companies')
export class Company extends BaseEntity {
  // ... other properties
}
```

**After:**
```typescript
import {
  Entity,
  Column,
  OneToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // ... other properties
}
```

### 2. Built Shared Database Package
Ensured the `@sabs/database` package was properly built by running:
```bash
cd packages/shared/database && npm run build
```

## Verification
After applying the fix:
1. ✅ TypeScript compilation passes without errors
2. ✅ All `FindOneOptions<Company>` usage works correctly
3. ✅ Properties `id`, `createdAt`, and `updatedAt` are properly recognized
4. ✅ Build process completes successfully

## Files Modified
- `packages/services/company-service/src/companies/entities/company.entity.ts`

## Key Learnings
1. **Entity inheritance should be used carefully**: The `BaseEntity` with `companyId` was designed for entities that belong to companies, not for the Company entity itself
2. **Proper TypeORM decorators**: Using TypeORM's built-in decorators directly ensures proper type inference
3. **Dependency management**: Shared packages need to be built before they can be consumed by other packages

## Testing
The fix was verified by:
- Running `npm run build` multiple times
- Confirming no TypeScript errors
- Ensuring all TypeORM queries compile correctly

## Additional Notes
This fix resolves the TypeScript compilation issues while maintaining the same database schema and functionality. All existing TypeORM queries continue to work as expected, but now with proper type safety.