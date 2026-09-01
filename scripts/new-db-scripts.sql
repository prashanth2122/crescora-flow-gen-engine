-- Creates the generic FLOW runtime tables in the shared `public` schema.

SET search_path TO public;

CREATE TABLE "flow_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "collection" TEXT NOT NULL,
    "dataJson" JSONB NOT NULL,
    "uniqueKeyField" TEXT,
    "uniqueKeyValueNormalized" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdByConversationId" TEXT,
    "updatedByConversationId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "flow_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "flow_record_indexes" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "collection" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "valueText" TEXT NOT NULL,
    "valueNormalized" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "flow_record_indexes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "flow_record_schemas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "collection" TEXT NOT NULL,
    "schemaJson" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "flow_record_schemas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "flow_record_mutation_audits" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "collection" TEXT NOT NULL,
    "recordId" TEXT,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "actorUserId" TEXT,
    "actorRole" TEXT,
    "source" TEXT,
    "botId" TEXT,
    "conversationId" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "flow_record_mutation_audits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "flow_record_idempotency_keys" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "collection" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "recordId" TEXT,
    "resultJson" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "flow_record_idempotency_keys_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "flow_records_tenantId_collection_deletedAt_updatedAt_idx"
ON "flow_records"("tenantId", "collection", "deletedAt", "updatedAt");

CREATE INDEX "flow_records_tenantId_collection_createdAt_idx"
ON "flow_records"("tenantId", "collection", "createdAt");

CREATE UNIQUE INDEX "flow_records_tenantId_collection_uniqueKeyField_uniqueKeyValue_key"
ON "flow_records"("tenantId", "collection", "uniqueKeyField", "uniqueKeyValueNormalized");

CREATE INDEX "flow_record_indexes_tenantId_collection_field_valueNormalized_idx"
ON "flow_record_indexes"("tenantId", "collection", "field", "valueNormalized");

CREATE INDEX "flow_record_indexes_recordId_idx"
ON "flow_record_indexes"("recordId");

CREATE INDEX "flow_record_schemas_tenantId_isActive_idx"
ON "flow_record_schemas"("tenantId", "isActive");

CREATE UNIQUE INDEX "flow_record_schemas_tenantId_collection_key"
ON "flow_record_schemas"("tenantId", "collection");

CREATE INDEX "flow_record_mutation_audits_tenantId_collection_createdAt_idx"
ON "flow_record_mutation_audits"("tenantId", "collection", "createdAt");

CREATE INDEX "flow_record_mutation_audits_recordId_createdAt_idx"
ON "flow_record_mutation_audits"("recordId", "createdAt");

CREATE INDEX "flow_record_mutation_audits_action_status_createdAt_idx"
ON "flow_record_mutation_audits"("action", "status", "createdAt");

CREATE UNIQUE INDEX "flow_record_idempotency_keys_tenantId_collection_idempotencyKey_action_key"
ON "flow_record_idempotency_keys"("tenantId", "collection", "idempotencyKey", "action");

CREATE INDEX "flow_record_idempotency_keys_tenantId_collection_createdAt_idx"
ON "flow_record_idempotency_keys"("tenantId", "collection", "createdAt");

CREATE INDEX "flow_record_idempotency_keys_recordId_idx"
ON "flow_record_idempotency_keys"("recordId");

CREATE INDEX "flow_record_idempotency_keys_expiresAt_idx"
ON "flow_record_idempotency_keys"("expiresAt");

ALTER TABLE "flow_record_indexes"
ADD CONSTRAINT "flow_record_indexes_recordId_fkey"
FOREIGN KEY ("recordId") REFERENCES "flow_records"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "flow_record_mutation_audits"
ADD CONSTRAINT "flow_record_mutation_audits_recordId_fkey"
FOREIGN KEY ("recordId") REFERENCES "flow_records"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "flow_record_idempotency_keys"
ADD CONSTRAINT "flow_record_idempotency_keys_recordId_fkey"
FOREIGN KEY ("recordId") REFERENCES "flow_records"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
