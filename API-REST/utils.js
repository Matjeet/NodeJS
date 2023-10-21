// leer un JSON en ESmodule
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
// Para leer varios JSON y no repetir el código.
export const readJSON = (path) => require(path)
