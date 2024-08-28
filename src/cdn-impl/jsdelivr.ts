import { CdnType } from '../consts';
import { CdnBase, CdnFileIdentifier } from './cdn-base';

const JSDELIVR_BASE = 'https://cdn.jsdelivr.net/npm/';
const JSDELIVR_API_BASE = 'https://data.jsdelivr.com/v1/package/npm/';


type FlatFiles = {
  files: Array<{
    name: string;
  }>
}

const collectJsdlvrPackageJsonPaths = (node: FlatFiles): string[] => {
  return node.files.filter(file => file.name.endsWith('package.json')).map(file => file.name);
};


export class Jsdelivr extends CdnBase {
  public name = CdnType.JSDELIVR;

  async getPackageJsonPaths(packageName: string, packageVersion: string): Promise<string[]> {
    return this.fetchPackageJsons(`${JSDELIVR_API_BASE}${packageName}@${packageVersion}/flat`, collectJsdlvrPackageJsonPaths);
  }

  getFileUniqueIdentifier(identifier: CdnFileIdentifier) {
    return`${JSDELIVR_BASE}${identifier.packageName}@${identifier.packageVersion}/${identifier.filePath}`;
  }
}
