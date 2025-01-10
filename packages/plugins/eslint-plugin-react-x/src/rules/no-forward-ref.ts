import * as AST from "@eslint-react/ast";
import { isForwardRefCall } from "@eslint-react/core";
import { _ } from "@eslint-react/eff";
import { getSettingsFromContext } from "@eslint-react/shared";
import type { RuleContext, RuleFeature } from "@eslint-react/types";
import type { TSESTree } from "@typescript-eslint/types";
import { AST_NODE_TYPES as T } from "@typescript-eslint/types";
import type { RuleFix, RuleFixer } from "@typescript-eslint/utils/ts-eslint";
import { compare } from "compare-versions";
import type { CamelCase } from "string-ts";
import { match, P } from "ts-pattern";

import { createRule } from "../utils";

export const RULE_NAME = "no-forward-ref";

export const RULE_FEATURES = [
  "CHK",
  "MOD",
] as const satisfies RuleFeature[];

export type MessageID = CamelCase<typeof RULE_NAME>;

export default createRule<[], MessageID>({
  meta: {
    type: "problem",
    docs: {
      description: "disallow the use of 'forwardRef'",
      [Symbol.for("rule_features")]: RULE_FEATURES,
    },
    fixable: "code",
    messages: {
      noForwardRef: "In React 19, 'forwardRef' is no longer necessary. Pass 'ref' as a prop instead.",
    },
    schema: [],
  },
  name: RULE_NAME,
  create(context) {
    if (!context.sourceCode.text.includes("forwardRef")) {
      return {};
    }
    const { version } = getSettingsFromContext(context);
    if (compare(version, "19.0.0", "<")) {
      return {};
    }
    return {
      CallExpression(node) {
        if (!isForwardRefCall(node, context)) {
          return;
        }
        context.report({
          messageId: "noForwardRef",
          node,
          fix: getFix(node, context),
        });
      },
    };
  },
  defaultOptions: [],
});

function getFix(node: TSESTree.CallExpression, context: RuleContext): (fixer: RuleFixer) => RuleFix[] {
  return (fixer) => {
    const [componentNode] = node.arguments;
    if (componentNode == null || !AST.isFunction(componentNode)) {
      return [];
    }
    return [
      // unwrap component from forwardRef call
      fixer.removeRange([node.range[0], componentNode.range[0]]),
      fixer.removeRange([componentNode.range[1], node.range[1]]),
      // update component props and ref arguments to match the new signature
      ...getComponentPropsFixes(
        componentNode,
        node.typeArguments?.params ?? [],
        fixer,
        context,
      ),
    ] as const;
  };
}

function getComponentPropsFixes(
  node: AST.TSESTreeFunction,
  typeArguments: TSESTree.TypeNode[],
  fixer: RuleFixer,
  context: RuleContext,
) {
  const getText = (node: TSESTree.Node) => context.sourceCode.getText(node);
  const [arg0, arg1] = node.params;
  const [typeArg0, typeArg1] = typeArguments;
  if (arg0 == null) {
    return [];
  }
  const fixedArg0Text = match(arg0)
    .with({ type: T.Identifier }, (n) => `...${n.name}`)
    .with({ type: T.ObjectPattern }, (n) => n.properties.map(getText).join(", "))
    .otherwise(() => _);
  const fixedArg1Text = match(arg1)
    .with(P.nullish, () => "ref")
    .with({ type: T.Identifier, name: "ref" }, () => "ref")
    .with({ type: T.Identifier, name: P.not("ref") }, (n) => `ref: ${n.name}`)
    .otherwise(() => _);
  if (fixedArg0Text == null || fixedArg1Text == null) {
    return [];
  }
  if (typeArg0 == null || typeArg1 == null) {
    return [
      fixer.replaceText(
        arg0,
        [
          "{",
          fixedArg1Text + ",",
          fixedArg0Text,
          "}",
        ].join(" "),
      ),
      ...arg1 == null
        ? []
        : [fixer.remove(arg1), fixer.removeRange([arg0.range[1], arg1.range[0]])],
    ] as const;
  }
  return [
    fixer.replaceText(
      arg0,
      [
        "{",
        fixedArg1Text + ",",
        fixedArg0Text,
        "}:",
        getText(typeArg1),
        "&",
        "{",
        `ref:`,
        `React.RefObject<${getText(typeArg0)}>`,
        "}",
      ].join(" "),
    ),
    ...arg1 == null
      ? []
      : [fixer.remove(arg1), fixer.removeRange([arg0.range[1], arg1.range[0]])],
  ] as const;
}
