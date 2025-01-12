import { dual } from "@eslint-react/eff";

import { ERPhaseRelevance } from "./constants";
import type { ERPhaseKind } from "./phase";

export const isInversePhase: {
  (a: ERPhaseKind): (b: ERPhaseKind) => boolean;
  (a: ERPhaseKind, b: ERPhaseKind): boolean;
} = dual(2, (a: ERPhaseKind, b: ERPhaseKind) => ERPhaseRelevance.get(a) === b);
