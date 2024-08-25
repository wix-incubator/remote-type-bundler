import { CdnType } from '../consts';
import { CdnBase, CdnFileIdentifier } from './cdn-base';

const UNPKG_BASE = 'https://unpkg.com/';

type FileNode = {
  path?: string;
  type: string;
  files?: FileNode[];
};

const collectUnpkgPackageJsonPaths = (node: FileNode, result: string[] = []) => {
  if (!node) {
    return result;
  }
  if (node.path && node.path.endsWith('package.json')) {
    result.push(node.path);
  }

  if (node.files && Array.isArray(node.files)) {
    // prefer files to inner directories
    node.files.sort((f1, f2) => f1.type === 'file' ? -1 : f2.type === 'file' ? 1 : 0)
      .forEach(file => collectUnpkgPackageJsonPaths(file, result));
  }

  return result;
};

export class Unpkg extends CdnBase {
  public name = CdnType.UNPKG;

  async getPackageJsonPaths(packageName: string, packageVersion: string) {
    return this.fetchPackageJsons(`${UNPKG_BASE}${packageName}@${packageVersion}/?meta`, collectUnpkgPackageJsonPaths);
  }

  getFileUniqueIdentifier(identifier: CdnFileIdentifier) {
    return`${UNPKG_BASE}${identifier.packageName}@${identifier.packageVersion}/${identifier.filePath}`;
  }
}
