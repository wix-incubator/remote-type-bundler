// This file is adopted from: https://github.com/egoist/tsup/blob/dev/src/rollup/ts-resolve.ts
import fs from 'fs'
import path from 'path'
import _resolve from 'resolve'
import createDebug from 'debug'
import { builtinModules } from 'module'
import { prepareFile } from './files';
import { PluginImpl, ResolveIdResult } from 'rollup'
import { FetcherFunction } from './fetch-cdn'

const debug = createDebug('ts-resolve')

const resolveModule = (
  id: string,
  opts: _resolve.AsyncOpts
) : Promise<string | null> =>
  new Promise((resolve, reject) => {
    if (debug.enabled) {
      debug(`resolveModule: ${id}, ${JSON.stringify(opts)}`);
    }
    _resolve(id, opts, (err, resolved) => {
      if (err) {
        debug(`resolveModule error for ${id} with error: ${err}`);
      } else {
        debug(`resolveModule success for ${id} with resolved: ${resolved}`);
      }
      // @ts-expect-error
      if (err?.code === 'MODULE_NOT_FOUND') return resolve(null)
      if (err) return reject(err)
      resolve(resolved || null)
    })
  })

export interface TsResolveOptions {
  projectRootPath: string;
  saveFileFromPackage: FetcherFunction;
}

export const tsResolvePlugin: PluginImpl<TsResolveOptions> = (pluginOptions : TsResolveOptions | undefined) => {
  if (!pluginOptions) {
    throw new Error('Unable to initialize without options');
  }

  const { projectRootPath, saveFileFromPackage } = pluginOptions;

  if (!projectRootPath || !saveFileFromPackage) {
    throw new Error('Unable to initialize without options.projectRootPath or options.saveFileFromPackage');
  }

  const resolveExtensions = ['.d.ts', '.ts', '/index.d.ts', '/build/cjs/{extension}.d.ts', '/build/{extension}.d.ts']
  const resolveBaseOpts = {
      readFile: async (fileName: string, cb: Function) => {
          debug('resolveModule readFile', fileName);
          try {
            const data = await fs.promises.readFile(fileName);
            cb(null, data);
          } catch(ex) {
            cb(ex);
          }
      }
  }

  return {
    name: 'ts-resolve',

    async resolveId(source: string, importer?: string): Promise<ResolveIdResult> {
      debug('resolveId source: %s', source)
      debug('resolveId importer: %s ', importer)

      if (source.startsWith('/') || source.startsWith('.')) {
        const requestRelativeToProjectRoot = importer ? path.relative(projectRootPath, path.join(path.dirname(importer), source)) : path.relative(projectRootPath, source);
        if (requestRelativeToProjectRoot.startsWith('..')) {
          throw new Error(`Unable to process ${source} as it is outside of the project root - ${requestRelativeToProjectRoot}`);
        }
      }

      await prepareFile(source, importer, projectRootPath, saveFileFromPackage, resolveExtensions);

      // ignore IDs with null character, these belong to other plugins
      if (/\0/.test(source)) return null

      if (builtinModules.includes(source)) return false

      // Skip absolute path
      if (path.isAbsolute(source)) {
        debug(`skipped absolute path: %s`, source)
        return null
      }

      const basedir = importer
        ? await fs.promises.realpath(path.dirname(importer))
        : process.cwd()

      // A relative path
      if (source[0] === '.') {
        return resolveModule(source, {
            ...resolveBaseOpts,
          basedir,
          extensions: resolveExtensions,
        })
      }

      let id = null

      // Try resolving as relative path if `importer` is not present
      if (!importer) {
        id = await resolveModule(`./${source}`, {
           ...resolveBaseOpts,
          basedir,
          extensions: resolveExtensions,
        })
      }

      // Try resolving in node_modules
      if (!id) {
        debug(`resolve module for ${source}`);
        id = await resolveModule(extractModuleName(source), {
            ...resolveBaseOpts,
          basedir,
          extensions: resolveExtensions,
          packageFilter(pkg: { main?: string; types?: string; typings?: string; name?: string; exports?: any; }) {
            pkg.main = pkg.types || pkg.typings;
            if (!pkg.main && pkg.exports) {
              const module = `.${source.replace(pkg.name ?? '', '')}`;
              if (pkg.exports[module]) {
                const exp = pkg.exports[module];
                pkg.main = typeof exp === 'string' ?
                  exp :
                  (exp.types || exp.typings || exp.import || exp.require);
                pkg.main = pkg.main?.replace(/\.js$/, '.d.ts').replace(/^\.\//, '');
              }
            }
            return pkg;
          },
          pathFilter(pkg, path, relativePath) {
            debug('pathFilter %s %s', path, relativePath);
            // remove sub path in the module
            return path.replace(`/node_modules/${relativePath}`, '/node_modules') as string;
          },
          moduleDirectory: ['node_modules', 'node_modules/@types'],
        })
      }

      if (id) {
        debug('resolved %s to %s', source, id)
        return id
      }

      debug('mark %s as external', source)
      // Just make it external if can't be resolved, i.e. tsconfig path alias
      return false
    },
  };
}

function extractModuleName(deepImportStr: string): string {
  if (!deepImportStr) {
    return '';
  }

  if (deepImportStr.endsWith('.js')) {
    return deepImportStr.replace('.js', '');
  }

  const parts = deepImportStr.split('/');

  return (parts[0].startsWith('@')) ? parts[0] + '/' + parts[1] : parts[0];
}
