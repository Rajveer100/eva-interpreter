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

    transformSwitchToIf(switchExpr) {
        const [_tag, ...cases] = switchExpr;

        const ifExp = ['if', null, null, null];
        let current = ifExp;

        for (let i = 0; i < cases.length - 1; i += 1) {
            const [currentCond, currentBlock] = cases[i];
            current[1] = currentCond;
            current[2] = currentBlock;

            const [nextCond, nextBlock] = cases[i + 1];

            current[3] = nextCond === 'else' ? nextBlock : ['if'];
            current = current[3];
        }

        return ifExp
    }

    transformForToWhile(forExpr) {
        const [_tag, init, condition, modifier, body] = forExpr;

        const whileExpr = ['while', condition, body];

        let whileBody = whileExpr[2];
        whileBody.push(modifier);

        return ['begin', init, whileExpr];
    }

    transformIncToSet(incExpr) {
        const [_tag, name] = incExpr;

        return ['set', name, ['+', name, 1]];
    }

    transformDecToSet(decExpr) {
        const [_tag, name] = decExpr;

        return ['set', name, ['-', name, 1]];
    }

    transformIncByToSet(incByExpr) {
        const [_tag, name, value] = incByExpr;

        return ['set', name, ['+', name, value]];
    }

    transformDecByToSet(decByExpr) {
        const [_tag, name, value] = decByExpr;

        return ['set', name, ['-', name, value]];
    }
}

module.exports = Transformer;