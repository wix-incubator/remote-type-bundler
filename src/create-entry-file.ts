import fetch from 'node-fetch';
import { Exports, PackageJson, TypeDefs } from './package-json';

type FileNode = {
  path?: string;
  type: string;
  files?: FileNode[];
};

const collectPackageJsonPaths = (node: FileNode, result: string[] = []) => {
  if (!node) {
    return result;
  }
  if (node.path && node.path.endsWith('package.json')) {
    result.push(node.path);
  }

  if (node.files && Array.isArray(node.files)) {
    // prefer files over inner directories
    node.files.sort((f1, f2) => f1.type === 'file' ? -1 : f2.type === 'file' ? 1 : 0)
      .forEach(file => collectPackageJsonPaths(file, result));
  }

  return result;
};

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

export const createPackageTypes = async (packageName: string, packageVersion: string, fileFetcher: (filePath: string, content?: string) => Promise<string>) => {
  const url = `https://unpkg.com/${packageName}@${packageVersion}/?meta`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Network response was not ok ${response.statusText}`);
  }
  const packageMeta = await response.json();

  const pathsToRead = collectPackageJsonPaths(packageMeta);
  const exportsPaths = new Set<string>();
  const results = await Promise.all(pathsToRead.map(async packageJsonPath => {
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

