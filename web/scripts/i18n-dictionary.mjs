import ts from "typescript";

export function parseLocaleDictionary(name, source) {
  const dictionary = JSON.parse(source);
  if (!dictionary || typeof dictionary !== "object" || Array.isArray(dictionary)) {
    throw new Error(name + ": expected a JSON object");
  }

  // JSON.parse keeps the final value for a duplicate key. Inspect the original properties.
  const sourceFile = ts.parseJsonText(name, source);
  const properties = sourceFile.statements[0].expression.properties;
  const keys = new Set();
  for (const property of properties) {
    const key = property.name.text;
    if (keys.has(key)) {
      throw new Error(name + ": duplicate translation key " + JSON.stringify(key));
    }
    keys.add(key);
  }
  return dictionary;
}
