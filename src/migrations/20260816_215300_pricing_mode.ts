import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds product.pricingMode. Existing catalog uses a single product price
 * (variant prices were duplicates of the product price), so default is "product".
 * Variant priceInINR values are left untouched.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_products_pricing_mode" AS ENUM('product', 'variant');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__products_v_version_pricing_mode" AS ENUM('product', 'variant');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "pricing_mode" "enum_products_pricing_mode" DEFAULT 'product';
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_pricing_mode" "enum__products_v_version_pricing_mode" DEFAULT 'product';

    UPDATE "products" SET "pricing_mode" = 'product' WHERE "pricing_mode" IS NULL;
    UPDATE "_products_v" SET "version_pricing_mode" = 'product' WHERE "version_pricing_mode" IS NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" DROP COLUMN IF EXISTS "pricing_mode";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_pricing_mode";
    DROP TYPE IF EXISTS "public"."enum_products_pricing_mode";
    DROP TYPE IF EXISTS "public"."enum__products_v_version_pricing_mode";
  `)
}
