import { Plugin } from 'rollup';
// @ts-ignore
import builtins from 'builtins';

// Regular expression to match import/export statements, excluding those within comments
const importsMatcher = /^(?!.*\/\/.*)(?!.*\/\*[\s\S]*?\*\/)(import|export) .* from '([a-z0-9_]+)';$/gm;

// the bundle should not include imports or exports of any kind,
// if these are native node modules they should be removed, but if they are not, an error should be thrown
export function importsFixer(): Plugin {
  return {
    name: 'imports-fixer-postprocess',
    generateBundle(options, bundle) {
      if (Object.keys(bundle).length === 0) {
        throw new Error('No files were bundled');
      } else {
        const file = Object.values(bundle)[0];
        const bundleCode = (file.type === 'chunk' ? file.code : file.source) as string;
        const nativeModules = builtins({ version: '*', experimental: true });
        const modifiedContent = bundleCode.replace(importsMatcher, (match, _, moduleName) => {
          if (nativeModules.includes(moduleName)) {
            return '';
          } else {
            throw new Error(`Unsupported module import in bundle: ${match}`);
          }
        });
        if (file.type === 'chunk') {
          file.code = modifiedContent;
        } else if (file.type === 'asset' && typeof file.source === 'string') {
          file.source = modifiedContent;
        }
      }
    }
  };
}

const processReExports = (original: string) => {
  let result = original;
  result = result.replace(/\/\* not-supported-hack-remove-me \*\/.*\n/g, '');
  result = result.replace(/\/\/ not-supported-hack-uncomment-me/g, '');
  return result;
}

// since there bundler does not support generating valid namespaces,
// we are generating the declaration as comments and replace as post process
export function typesFixerPostprocess(): Plugin {
  return {
    name: 'types-fixer-postprocess',
    generateBundle(options, bundle) {
      for (const [fileName, file] of Object.entries(bundle)) {
        if (file.type === 'chunk') {
          // Update the file content
          file.code = processReExports(file.code);
        } else if (file.type === 'asset' && typeof file.source === 'string') {
          // Update the file content
          file.source = processReExports(file.source);
        }
      }
    }
  };
}
