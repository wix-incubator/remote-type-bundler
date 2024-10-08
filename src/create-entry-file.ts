import { Exports, PackageJson, TypeDefs } from './package-json';
import { CdnBase, CDN } from './cdn-impl/cdn-base';

const isSupportedFile = (fileName: string) => {
  const validExtensions = /\.(js|ts|mjs|tsx)$/i;

  return validExtensions.test(fileName);
};

function moduleNameToVariable(modulePath: string) {
  return modulePath
    .split('/')                // Split the path by '/'
    .map((part, index) => {
      // Remove any leading '@' and other non-alphanumeric characters and replace . with the word Dot
      part = part.replace(/[^a-zA-Z0-9]/g, '');
      if (index === 0) {
        // Lowercase the first part
        return part.toLowerCase();
      } else {
        // Capitalize the first letter of subsequent parts
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }
    })
    .join('');                 // Join all parts together
}

const getTypesForEntry = (packageName: string, entry: TypeDefs | string, fallbackJs?: string, innerPath?: string) => {
  let mainImport = typeof entry === 'string' ? entry : entry.typesBundle || entry.types || entry.typings || fallbackJs;
  if (mainImport) {
    mainImport = mainImport.startsWith('.') || mainImport.startsWith('/') ? mainImport : `./${mainImport}`;
    const modulePath = `${packageName}${innerPath ? `/${innerPath}` : ''}`;
    const variableName = `${moduleNameToVariable(modulePath)}`;
    let moduleIndex = mainImport.replace(/^(?:\.\.\/)+/, './')
      .replace('.d.ts', '.ts')
      .replace(/\.\w+$/, '.d.ts');
    return isSupportedFile(mainImport) ? `
      import * as ${variableName} from "${moduleIndex}"; 
      declare module "${modulePath}" {
        /* not-supported-hack-remove-me */ export { ${variableName} };
        // not-supported-hack-uncomment-me export = ${variableName};
      }
      `.replace(/\n\s\s\s\s\s\s/g, '\n') : '';
  }
  return '';

};

const getTypesImportForModule = (packageName: string, pkgJsonData: PackageJson, exportsPaths: Set<string>, path?: string): string => {
  let result = getTypesForEntry(packageName, pkgJsonData, pkgJsonData.main, path);
  if (pkgJsonData.exports) {
    try {
      Object.keys(pkgJsonData.exports).forEach(exportEntry => {
        if (exportEntry !== '.') {
          let exportInfo = pkgJsonData.exports[exportEntry];
          const fallbackJs = typeof exportInfo === 'string' ?
            exportInfo as string :
            (exportInfo as Exports).require;
          const innerPath = exportEntry.replace(/^\.\/+/, '');
          // Cannot supports exports like "./transformations/*"
          if (!innerPath.endsWith('/*') && !exportsPaths.has(innerPath)) {
            exportsPaths.add(innerPath);
            result += getTypesForEntry(packageName, exportInfo, fallbackJs, innerPath);
          }
        }
      });
    } catch (e) {
      console.error('Failed to parse exports format, skipping exports', e);
    }
  }
  return result;
};

export const createPackageTypes = async (packageName: string, packageVersion: string, fileFetcher: (filePath: string, content?: string) => Promise<string>, cdnImpl: CDN) => {
  const pathsToRead = await cdnImpl.getPackageJsonPaths(packageName, packageVersion);
  const exportsPaths = new Set<string>();
  const results = await Promise.all(pathsToRead
    // so the order of the package json files is deterministic from top level to deeper level
    .sort((p1, p2) => p1.length - p2.length)
    .map(async packageJsonPath => {
      const pkgJsonData: any = await fileFetcher(packageJsonPath);
      const pkgJson = JSON.parse(pkgJsonData);
      const modulePath = packageJsonPath.replace('/package.json', '').replace(/^\/+/, '');
      return {
        modulePath,
        content: getTypesImportForModule(packageName, pkgJson, exportsPaths, modulePath)
      };
    }));
  return results.filter(({modulePath}) => !modulePath || !exportsPaths.has(modulePath)).map(({content}) => content).join('\n');
};

