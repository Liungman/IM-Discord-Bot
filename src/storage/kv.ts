import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const KV_FILE = path.join(DATA_DIR, 'kv.json');

type Store = Record<string, any>;

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(KV_FILE)) fs.writeFileSync(KV_FILE, JSON.stringify({}), 'utf8');
}

export function getNamespace<T = any>(ns: string): T {
  ensure();
  const raw = fs.readFileSync(KV_FILE, 'utf8');
  const json = (JSON.parse(raw) as Store) ?? {};
  return (json[ns] as T) ?? ({} as T);
}

export function setNamespace(ns: string, value: any) {
  ensure();
  const raw = fs.readFileSync(KV_FILE, 'utf8');
  const json = (JSON.parse(raw) as Store) ?? {};
  json[ns] = value;
  fs.writeFileSync(KV_FILE, JSON.stringify(json, null, 2), 'utf8');
}