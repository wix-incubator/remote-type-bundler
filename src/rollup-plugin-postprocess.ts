import { Plugin } from 'rollup';

const processReExports = (original: string) => {
  let result = original;
  result = result.replace(/\/\* not-supported-hack-remove-me \*\/.*\n/g, '');
  result = result.replace(/\/\/ not-supported-hack-uncomment-me/g, '');
  return result;
}

export default function typesFixerPostprocess(): Plugin {
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
