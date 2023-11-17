import type { TSESTreeFunction } from "@eslint-react/ast";
import type { O } from "@eslint-react/tools";
import type { TSESTree } from "@typescript-eslint/types";

export type ESLRHook = {
  // The unique id of the hook
  id: string;
  // The AST node of the hook
  node: TSESTreeFunction;
  // The name of the hook
  name: string;
  // The `HookFlag` of the hook, reserved for future use
  // flag: bigint;
  // The type of the hook, reserved for future use
  // type: number;
  // The number of hooks defined in the hook, reserved for future use
  // size: number;
  // The number of slots the hook takes, (1 + the number of other hooks it calls)
  cost: number;
  // The dependencies of the hook
  deps: O.Option<(TSESTree.Expression | TSESTree.Identifier)[]>;
};
