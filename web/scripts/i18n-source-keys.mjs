import ts from "typescript";

export function literalTranslationKeys(path, source) {
  const syntax = ts.createSourceFile(path, source, ts.ScriptTarget.Latest);
  const keys = new Set();

  function visit(node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "t") {
      let argument = node.arguments[0];
      while (argument && ts.isParenthesizedExpression(argument)) {
        argument = argument.expression;
      }
      if (argument && ts.isStringLiteralLike(argument)) keys.add(argument.text);
    }
    ts.forEachChild(node, visit);
  }

  visit(syntax);
  return keys;
}
