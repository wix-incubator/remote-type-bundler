interface Author {
  name: string;
  email: string;
}

export interface TypeDefs {
  typings?: string;
  types?: string;
}

export interface Exports extends TypeDefs {
  import: string;
  require: string;
}

interface PackageExports {
  [key: string]: Exports | string;
}

interface Scripts {
  [key: string]: string;
}

interface Dependencies {
  [key: string]: string;
}

export interface PackageJson extends TypeDefs {
  name: string;
  version: string;
  license: string;
  author: Author;
  main: string;
  module?: string;
  type: string;
  exports: PackageExports;
  sideEffects: boolean;
  files: string[];
  publishConfig: {
    registry: string;
    access: string;
  };
  scripts: Scripts;
  "lint-staged": LintStaged;
  dependencies: Dependencies;
  optionalDependencies: Dependencies;
  devDependencies: Dependencies;
}
