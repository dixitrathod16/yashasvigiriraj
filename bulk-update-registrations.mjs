#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import xlsx from 'xlsx';
import pLimit from 'p-limit';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = 'user_registrations';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;

    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
}

function resolveFilePath(filePath) {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  return path.join(process.cwd(), filePath);
}

function normaliseId(id) {
  if (!id) return '';
  return String(id).trim().toUpperCase();
}

function readWorkbookRows(filePath) {
  const workbook = xlsx.readFile(filePath, { cellDates: false });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('No sheets found in the workbook.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = xlsx.utils.sheet_to_json(worksheet, {
    defval: null,
    raw: true,
  });

  return rows;
}

function normaliseArrivalDate(value) {
  if (value === null || value === undefined) return null;

  if (typeof value === 'number') {
    const parsed = xlsx.SSF?.parse_date_code?.(value);
    if (!parsed) return null;
    const yyyy = parsed.y.toString().padStart(4, '0');
    const mm = parsed.m.toString().padStart(2, '0');
    const dd = parsed.d.toString().padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Already in desired format
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }

    return trimmed;
  }

  return null;
}

function identifyMissingAttributes(existingItem, rowData) {
  const missing = [];
  const assignments = [];
  const names = {};
  const values = {};
  const updates = {};

  const entries = Object.entries(rowData).filter(([key]) => key && !/^id$/i.test(key));

  entries.forEach(([key, value]) => {
    key = key.trim();
    let cellValue = value;
    if (key === 'arrivalDate') {
      cellValue = normaliseArrivalDate(value);
    }

    if (cellValue === null || cellValue === undefined || (typeof cellValue === 'string' && cellValue.trim() === '')) {
      return;
    }

    const existingValue = existingItem[key];

    // let isMissing = false;
    // if (key === 'arrivalDate') {
    //   isMissing = true;
    // } else {
    //   isMissing = existingValue === undefined || existingValue === null || (typeof existingValue === 'string' && existingValue.trim() === '');
    // }

    // if (existingValue !== cellValue) {
    //   console.log(`${key} updated for ${existingItem.id} with old value ${existingValue} and new value ${cellValue}`);
    // }
    const isMissing = existingValue === undefined || existingValue === null || (typeof existingValue === 'string' && existingValue.trim() === '');

    if (isMissing) {
      const attrAlias = `#attr_${missing.length}`;
      const valueAlias = `:val_${missing.length}`;
      names[attrAlias] = key;
      values[valueAlias] = cellValue;
      assignments.push(`${attrAlias} = ${valueAlias}`);
      missing.push(key);
      updates[key] = cellValue;
    }
  });

  if (missing.length > 0) {
    const timestampAlias = '#attr_updatedAt';
    const timestampValueAlias = ':val_updatedAt';
    names[timestampAlias] = 'updatedAt';
    const timestamp = new Date().toISOString();
    values[timestampValueAlias] = timestamp;
    assignments.push(`${timestampAlias} = ${timestampValueAlias}`);
    updates.updatedAt = timestamp;
  }

  return {
    missing,
    assignments,
    names,
    values,
    updates,
  };
}

async function scanAllRegistrations(docClient) {
  const map = new Map();
  let lastEvaluatedKey;
  let scanned = 0;
  const duplicates = new Set();
  const missingIds = [];

  do {
    const { Items = [], LastEvaluatedKey } = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      ExclusiveStartKey: lastEvaluatedKey,
    }));

    scanned += Items.length;

    Items.forEach((item) => {
      const id = normaliseId(item.id);
      if (!id) {
        missingIds.push(item);
        return;
      }

      if (map.has(id)) {
        duplicates.add(id);
      }

      map.set(id, item);
    });

    lastEvaluatedKey = LastEvaluatedKey;
  } while (lastEvaluatedKey);

  if (missingIds.length > 0) {
    console.warn(`Found ${missingIds.length} scanned records without an id; they will be ignored.`);
  }

  return {
    map,
    scanned,
    duplicates: Array.from(duplicates),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const fileArg = args.file || args.f;

  if (!fileArg) {
    console.error('Usage: node bulk-update-registrations.mjs --file <path-to-excel> [--region <aws-region>] [--concurrency <number>] [--dry-run]');
    process.exit(1);
  }

  const excelPath = resolveFilePath(fileArg);
  if (!fs.existsSync(excelPath)) {
    console.error(`Excel file not found at ${excelPath}`);
    process.exit(1);
  }

  const region = args.region || process.env.AWS_REGION || process.env.REGION || 'us-east-1';
  const concurrency = Number(args.concurrency) > 0 ? Number(args.concurrency) : 10;
  const dryRun = Boolean(args['dry-run']);

  const rows = readWorkbookRows(excelPath);
  if (rows.length === 0) {
    console.error('No data rows found in the Excel sheet.');
    process.exit(1);
  }

  const client = new DynamoDBClient({ region });
  const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });

  console.info('Scanning DynamoDB table for existing registrations...');
  const { map: registrationIndex, scanned, duplicates } = await scanAllRegistrations(docClient);
  console.info(`Loaded ${registrationIndex.size} registrations (scanned ${scanned}).`);

  if (registrationIndex.size === 0) {
    console.error('No registrations found in DynamoDB. Aborting.');
    process.exit(1);
  }

  if (duplicates.length > 0) {
    console.warn(`Duplicate ids detected (${duplicates.length}). Later occurrences replaced earlier ones.`);
  }

  const limit = pLimit(concurrency);

  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let missingRecords = 0;
  const errors = [];

  const tasks = rows.map((row, index) => limit(async () => {
    const id = normaliseId(row.id || row.ID || row.Id);
    if (!id) {
      skipped += 1;
      console.warn(`Row ${index + 2}: Missing registration id, skipping.`);
      return;
    }

    try {
      const item = registrationIndex.get(id);
      if (!item) {
        missingRecords += 1;
        console.warn(`Row ${index + 2}: No record found for id ${id}`);
        return;
      }

      const key = {
        formType: item.formType,
        aadharNumber: typeof item.aadharNumber === 'number' ? item.aadharNumber : Number(item.aadharNumber),
      };

      if (!key.formType || Number.isNaN(key.aadharNumber)) {
        throw new Error(`Unable to build primary key for id ${id}. Received: ${JSON.stringify(key)}`);
      }

      const { missing, assignments, names, values, updates } = identifyMissingAttributes(item, row);

      if (missing.length === 0) {
        skipped += 1;
        return;
      }

      processed += 1;

      if (dryRun) {
        console.info(`Dry-run: would update id ${id} (${missing.join(', ')})`);
        updated += 1;
        return;
      }

      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: key,
        UpdateExpression: `SET ${assignments.join(', ')}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
      }));

      console.info(`Updated id ${id}: added [${missing.join(', ')}]`);
      Object.assign(item, updates);
      updated += 1;
    } catch (error) {
      errors.push({ id, error });
      console.error(`Row ${index + 2}: Failed to process id ${id}`, error);
    }
  }));

  await Promise.all(tasks);

  console.info('\nSummary:');
  console.info(`- Total rows: ${rows.length}`);
  console.info(`- Records processed (with missing attributes): ${processed}`);
  console.info(`- Records updated: ${updated}`);
  console.info(`- Rows skipped (no missing attributes or missing id): ${skipped}`);
  console.info(`- Records not found: ${missingRecords}`);
  console.info(`- Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.info('\nFailed items:');
    errors.forEach((entry) => {
      console.info(`  - id ${entry.id}: ${entry.error?.message || entry.error}`);
    });
  }

  if (dryRun) {
    console.info('\nDry-run complete. Re-run without --dry-run to apply updates.');
  }
}

main().catch((error) => {
  console.error('Unexpected failure:', error);
  process.exit(1);
});
