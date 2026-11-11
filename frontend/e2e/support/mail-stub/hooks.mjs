const stub = new URL("./nodemailer.mjs", import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "nodemailer") return { url: stub, shortCircuit: true };
  return nextResolve(specifier, context);
}
