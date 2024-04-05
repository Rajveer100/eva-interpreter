/**
 * AST Transformer.
 */
class Transformer {
    /**
     * Translates `def`-expr (function declaration)
     * into a variable declaration with a lambda
     * expression.
     */
    transformDefToLambda(defExpr) {
        const [_tag, name, params, body] = defExpr;
        return ['var', name, ['lambda', params, body]];
    }
}

module.exports = Transformer;