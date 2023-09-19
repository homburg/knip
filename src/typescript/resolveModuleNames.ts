import ts from 'typescript';
import { ensureRealFilePath, isVirtualFilePath } from './utils.js';

export function createCustomModuleResolver(
  customSys: typeof ts.sys,
  compilerOptions: ts.CompilerOptions,
  virtualFileExtensions: string[]
) {
  function resolveModuleNames(moduleNames: string[], containingFile: string): Array<ts.ResolvedModule | undefined> {
    return moduleNames.map(moduleName => resolveModuleName(moduleName, containingFile));
  }

  function resolveModuleName(name: string, containingFile: string): ts.ResolvedModule | undefined {
    const tsResolvedModule = ts.resolveModuleName(name, containingFile, compilerOptions, ts.sys).resolvedModule;

    // workspace package is returned here. Depending on paths in tsconfig.json.
    // If there is not matching paths entry, the module is marked as isExternalLibraryImport
    // And compared against dependencies in the package.json

    // If there is a matching paths entry, the module is marked as not isExternalLibraryImport
    // And marked as an ununsed dependency in the package.json

    if (virtualFileExtensions.length === 0) return tsResolvedModule;

    if (tsResolvedModule && !isVirtualFilePath(tsResolvedModule.resolvedFileName, virtualFileExtensions)) {
      return tsResolvedModule;
    }

    const customResolvedModule = ts.resolveModuleName(name, containingFile, compilerOptions, customSys).resolvedModule;

    if (!customResolvedModule || !isVirtualFilePath(customResolvedModule.resolvedFileName, virtualFileExtensions)) {
      return customResolvedModule;
    }

    const resolvedFileName = ensureRealFilePath(customResolvedModule.resolvedFileName, virtualFileExtensions);

    const resolvedModule: ts.ResolvedModuleFull = {
      extension: ts.Extension.Js,
      resolvedFileName,
      isExternalLibraryImport: customResolvedModule.isExternalLibraryImport,
    };

    return resolvedModule;
  }

  return resolveModuleNames;
}
