import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (
      (err.code === 'ERR_MODULE_NOT_FOUND' || err.code === 'ERR_UNSUPPORTED_DIR_IMPORT') &&
      (specifier.startsWith('.') || specifier.startsWith('file://'))
    ) {
      let targetPath;
      if (specifier.startsWith('file://')) {
        targetPath = fileURLToPath(specifier);
      } else if (context.parentURL) {
        const parentDir = path.dirname(fileURLToPath(context.parentURL));
        targetPath = path.resolve(parentDir, specifier);
      }
      if (targetPath) {
        for (const ext of ['.ts', '.tsx', '.js', '.json']) {
          if (fs.existsSync(targetPath + ext)) {
            return nextResolve(pathToFileURL(targetPath + ext).href, context);
          }
          if (fs.existsSync(path.join(targetPath, 'index' + ext))) {
            return nextResolve(pathToFileURL(path.join(targetPath, 'index' + ext)).href, context);
          }
        }
      }
    }
    throw err;
  }
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.json')) {
    const content = fs.readFileSync(fileURLToPath(url), 'utf8');
    return {
      format: 'json',
      source: content,
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
}
