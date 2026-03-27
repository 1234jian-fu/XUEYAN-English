const STORAGE_KEY = "temporary_vocabulary";

type VocabularyStore = Record<string, string[]>;

function normalizeItems(items: string[]) {
  return Array.from(
    new Set(items.map((item) => item.trim()).filter(Boolean))
  );
}

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function readStore(): VocabularyStore {
  if (!canUseSessionStorage()) {
    return {};
  }

  const raw = window.sessionStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as VocabularyStore;
  } catch {
    return {};
  }
}

function writeStore(store: VocabularyStore) {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getTemporaryVocabulary(characterId: string) {
  const store = readStore();
  return store[characterId] ?? [];
}

export function setTemporaryVocabulary(characterId: string, items: string[]) {
  const store = readStore();
  store[characterId] = normalizeItems(items);
  writeStore(store);
  return store[characterId];
}

export function mergeTemporaryVocabulary(characterId: string, items: string[]) {
  const existing = getTemporaryVocabulary(characterId);
  return setTemporaryVocabulary(characterId, [...existing, ...items]);
}
