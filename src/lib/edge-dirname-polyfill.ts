// Bug conhecido do Next.js: o `ua-parser-js` empacotado dentro de
// `next/server` referencia `__dirname` no nível do módulo, o que quebra
// com "ReferenceError: __dirname is not defined" assim que `next/server`
// é avaliado no Edge Runtime da Vercel (ver vercel/next.js#53968 e
// vercel/workflow#374 — bug ainda presente na 16.3.1, a versão mais
// recente do Next.js até o momento). Precisa ser importado ANTES de
// `next/server` em middleware.ts para rodar primeiro.
const target = globalThis as Record<string, unknown>;
if (typeof target.__dirname === "undefined") {
  target.__dirname = "/";
}

export {};
