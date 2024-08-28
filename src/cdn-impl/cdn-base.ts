import fetch from 'node-fetch';
import { CdnType } from '../consts';

export type CdnFileIdentifier = {
  packageName: string;
  packageVersion: string;
  filePath: string;
};

export interface CDN {
  name: CdnType;
  getPackageJsonPaths: (packageName: string, packageVersion: string) => Promise<string[]>;
  getFileUniqueIdentifier: (identifier: CdnFileIdentifier) => string;
  fetchFromCdn: (identifier: CdnFileIdentifier) => Promise<string>;
}

export abstract class CdnBase implements CDN {
  abstract name: CdnType;

  abstract getPackageJsonPaths(packageName: string, packageVersion: string): Promise<string[]>;
  abstract getFileUniqueIdentifier(identifier: CdnFileIdentifier): string;

  fetchFromCdn = async (identifier: CdnFileIdentifier): Promise<string> => {
    const url = this.getFileUniqueIdentifier(identifier);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network response was not ok ${response.statusText} for URL: ${url}`);
    }
    return response.text();
  }

  protected fetchPackageJsons = async (url: string, resultParser: (moduleData: any) => string[]): Promise<string[]> => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch package jsons ${this.name} ${response.statusText}`);
    }
    const packageMeta = await response.json();

    return resultParser(packageMeta);
  }
}
