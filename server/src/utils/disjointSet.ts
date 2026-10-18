type FileKey = string;

export class DisjointSet {
  private readonly parent = new Map<FileKey, FileKey>();

  private readonly size = new Map<FileKey, number>();

  constructor(keys: FileKey[]) {
    for (const key of keys) {
      this.parent.set(key, key);
      this.size.set(key, 1);
    }
  }

  find(key: FileKey): FileKey {
    const parent = this.parent.get(key);

    if (!parent) {
      this.parent.set(key, key);
      this.size.set(key, 1);
      return key;
    }

    if (parent === key) {
      return key;
    }

    const root = this.find(parent);
    this.parent.set(key, root);
    return root;
  }

  union(a: FileKey, b: FileKey): void {
    const rootA = this.find(a);
    const rootB = this.find(b);

    if (rootA === rootB) {
      return;
    }

    const sizeA = this.size.get(rootA) ?? 1;
    const sizeB = this.size.get(rootB) ?? 1;

    if (sizeA < sizeB) {
      this.parent.set(rootA, rootB);
      this.size.set(rootB, sizeA + sizeB);
    } else {
      this.parent.set(rootB, rootA);
      this.size.set(rootA, sizeA + sizeB);
    }
  }
}
