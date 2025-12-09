#!/usr/bin/env node

/**
 * Seed de media: toma las imágenes locales en apps/web/public/images/cabins/<slug>/
 * y las sube al bucket Supabase Storage (MEDIA_BUCKET), creando registros en cabin_images
 * si no existen. Útil para inicializar el panel de media cuando ya existen fotos locales.
 *
 * Requiere:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * Opcional:
 * - MEDIA_BUCKET (por defecto "media")
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env.local (raíz y apps/web)
const envPaths = [
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), 'apps', 'web', '.env.local'),
];
for (const envPath of envPaths) {
  dotenv.config({ path: envPath, override: false });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.MEDIA_BUCKET || 'media';

if (!supabaseUrl || !serviceKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const REPO_ROOT = path.join(process.cwd(), 'apps', 'web', 'public', 'images', 'cabins');
const VALID_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

async function ensureBucketExists() {
  const { data, error } = await supabase.storage.getBucket(bucket);
  if (error || !data) {
    console.error(`Bucket "${bucket}" no existe o no es accesible.`);
    process.exit(1);
  }
}

const toSlug = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'media';

async function listCabins() {
  const { data, error } = await supabase.from('cabins').select('id, slug').eq('active', true);
  if (error) {
    console.error('No se pudo obtener cabañas activas:', error);
    process.exit(1);
  }
  return data || [];
}

async function uploadIfNeeded(cabinSlug, filePath, fileName) {
  const storagePath = `cabins/${toSlug(cabinSlug)}/gallery/${fileName}`;

  // ya está en storage?
  const { data: head } = await supabase.storage.from(bucket).list(path.dirname(storagePath), {
    search: path.basename(storagePath),
    limit: 1,
  });
  if (head && head.find((f) => f.name === path.basename(storagePath))) {
    return storagePath;
  }

  const file = await fs.readFile(filePath);
  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file, { upsert: false });
  if (error) {
    throw new Error(`Error subiendo ${fileName}: ${error.message}`);
  }
  return storagePath;
}

async function ensureDbRecord(cabinId, storagePath, alt, sortOrder, isPrimary) {
  const publicUrl = supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;

  const { data: existing } = await supabase
    .from('cabin_images')
    .select('id')
    .eq('cabin_id', cabinId)
    .eq('image_url', publicUrl)
    .limit(1);

  if (existing && existing.length) return existing[0].id;

  const { data, error } = await supabase
    .from('cabin_images')
    .insert({
      cabin_id: cabinId,
      image_url: publicUrl,
      alt_text: alt,
      sort_order: sortOrder,
      is_primary: isPrimary,
    })
    .select()
    .maybeSingle();

  if (error || !data) {
    throw new Error(`No se pudo crear registro DB para ${alt}: ${error?.message}`);
  }
  return data.id;
}

async function seedCabin(cabin) {
  const localDir = path.join(REPO_ROOT, cabin.slug);
  try {
    await fs.access(localDir);
  } catch {
    console.warn(`No hay carpeta local para ${cabin.slug}, se omite.`);
    return { uploaded: 0 };
  }

  const files = (await fs.readdir(localDir)).filter((name) =>
    VALID_EXT.has(path.extname(name).toLowerCase())
  );

  if (!files.length) {
    console.warn(`Sin imágenes en ${localDir}`);
    return { uploaded: 0 };
  }

  // calcular sort_order continuo (sumar existentes)
  const { data: existing } = await supabase
    .from('cabin_images')
    .select('id, sort_order, is_primary')
    .eq('cabin_id', cabin.id)
    .order('sort_order', { ascending: true });

  const baseOrder = (existing || []).length;
  let uploaded = 0;

  for (let i = 0; i < files.length; i++) {
    const fileName = files[i];
    const filePath = path.join(localDir, fileName);
    const sortOrder = baseOrder + i + 1;
    const storagePath = await uploadIfNeeded(cabin.slug, filePath, fileName);
    const isPrimary = (existing || []).length === 0 && i === 0;
    await ensureDbRecord(cabin.id, storagePath, fileName, sortOrder, isPrimary);
    uploaded += 1;
  }

  // si no hay primary, marcar la primera
  if (!(existing || []).some((img) => img.is_primary)) {
    const { data: first } = await supabase
      .from('cabin_images')
      .select('id')
      .eq('cabin_id', cabin.id)
      .order('sort_order', { ascending: true })
      .limit(1);
    if (first && first[0]) {
      await supabase
        .from('cabin_images')
        .update({ is_primary: true })
        .eq('id', first[0].id);
    }
  }

  return { uploaded };
}

(async () => {
  await ensureBucketExists();
  const cabins = await listCabins();
  if (!cabins.length) {
    console.warn('No hay cabañas activas en DB.');
    return;
  }

  let total = 0;
  for (const cabin of cabins) {
    const { uploaded } = await seedCabin(cabin);
    total += uploaded;
    console.log(`Cabina ${cabin.slug}: ${uploaded} archivos sincronizados.`);
  }

  console.log(`Listo. Total sincronizado: ${total} archivos.`);
})();
