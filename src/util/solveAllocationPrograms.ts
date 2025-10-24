import { AllocationSuggestionProgram } from "@/types/ui/allocationSuggestions";

type HighsColumnResult = {
  Primal: number;
};

type HighsSolveResult = {
  Status: string;
  Columns: Record<string, HighsColumnResult>;
};

type HighsSolveOptions = {
  presolve?: "off" | "choose" | "on";
  threads?: number;
  time_limit?: number;
  [key: string]: unknown;
};

type HighsInstance = {
  solve: (problem: string, options?: HighsSolveOptions) =>
    | HighsSolveResult
    | undefined;
};

type HighsModuleFactory = (options?: {
  locateFile?: (file: string) => string;
}) => Promise<HighsInstance>;

export type AllocationSolution = {
  lineItemId: number;
  partnerId: number;
};

let highsInstancePromise: Promise<HighsInstance> | null = null;

const HIGHS_ASSET_BASE_URL = "https://lovasoa.github.io/highs-js/";

async function getHighsInstance(): Promise<HighsInstance> {
  if (typeof window === "undefined" && typeof self === "undefined") {
    throw new Error("HiGHS solver is only available in browser environments.");
  }

  if (!highsInstancePromise) {
    highsInstancePromise = import("@/lib/highs-browser.js").then((module) => {
      const loadHighs = module.default as HighsModuleFactory;
      return loadHighs({
        locateFile: (file: string) => `${HIGHS_ASSET_BASE_URL}${file}`,
      });
    });
  }

  return highsInstancePromise;
}

function buildVariableName(itemIdx: number, partnerIdx: number) {
  return `x_i${itemIdx}_p${partnerIdx}`;
}

function selectPartnerForItem(
  columns: Record<string, HighsColumnResult>,
  partnerCount: number,
  itemIdx: number
): number {
  let chosenPartnerIdx: number | null = null;
  let fallbackPartnerIdx = 0;
  let fallbackMax = -Infinity;

  for (let partnerIdx = 0; partnerIdx < partnerCount; partnerIdx++) {
    const variableName = buildVariableName(itemIdx, partnerIdx);
    const value = columns[variableName]?.Primal ?? 0;

    if (value > 0.5) {
      chosenPartnerIdx = partnerIdx;
      break;
    }

    if (value > fallbackMax) {
      fallbackMax = value;
      fallbackPartnerIdx = partnerIdx;
    }
  }

  if (chosenPartnerIdx !== null) {
    return chosenPartnerIdx;
  }

  return fallbackPartnerIdx;
}

function deriveAllocationsFromSolution(
  program: AllocationSuggestionProgram,
  solution: HighsSolveResult
): AllocationSolution[] {
  const columns = solution.Columns ?? {};
  const allocations: AllocationSolution[] = [];

  const partnerCount = program.partners.length;
  const itemCount = program.lineItems.length;

  for (let itemIdx = 0; itemIdx < itemCount; itemIdx++) {
    const partnerIdx = selectPartnerForItem(columns, partnerCount, itemIdx);
    const partnerId = program.partners[partnerIdx]?.partnerId;
    const lineItemId = program.lineItems[itemIdx]?.lineItemId;

    if (partnerId === undefined || lineItemId === undefined) {
      continue;
    }

    allocations.push({ lineItemId, partnerId });
  }

  return allocations;
}

export async function solveAllocationPrograms(
  programs: AllocationSuggestionProgram[]
): Promise<AllocationSolution[]> {
  if (!programs.length) {
    return [];
  }

  const highs = await getHighsInstance();
  const allocations: AllocationSolution[] = [];

  for (const program of programs) {
    const solution = highs.solve(program.lp, {
      presolve: "on",
      threads: 0,
      time_limit: 10,
    });

    if (!solution || solution.Status !== "Optimal") {
      throw new Error(
        `Unable to solve allocation program for item ${program.itemId}`
      );
    }

    allocations.push(...deriveAllocationsFromSolution(program, solution));
  }

  return allocations;
}
