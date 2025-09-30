import { auth } from "@/auth";
import { errorResponse, InternalError } from "@/util/errors";
import { AuthenticationError, AuthorizationError, ArgumentError } from "@/util/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import UserService from "@/services/userService";
import highsLoader from "highs";
import path from "path";

export const runtime = "nodejs";

const finalizedAutomatedSuggestionSchema = z.object({
  generalItems: z.array(
    z.object({
      totalQuantity: z.number(),
      lineItems: z.array(
        z.object({
          lineItemId: z.number(),
          quantity: z.number(),
        })
      ),
      requests: z.array(
        z.object({
          partnerId: z.number(),
          quantity: z.number(),
        })
      ),
    })
  ),
});

type Allocation = { lineItemId: number; quantity: number; partnerId: number };

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AuthenticationError("Session required");
    }

    if (!UserService.isAdmin(session.user.type)) {
      throw new AuthorizationError("Must be ADMIN, or SUPER_ADMIN");
    }

    const reqBody = await request.json();
    const parsed = finalizedAutomatedSuggestionSchema.safeParse(reqBody);
    
    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const allAllocations: Allocation[] = [];

    for (const generalItem of parsed.data.generalItems) {
      const { totalQuantity, lineItems, requests } = generalItem;

      // Normalize partner requests to match totalQuantity
      // Creates a per-partner target (floating point) that sums to totalQuantity

      const totalRequested = requests.reduce((sum, r) => sum + r.quantity, 0);
      const targets = requests.map((r) => ({
        partnerId: r.partnerId,
        target: totalRequested > 0 ? (r.quantity / totalRequested) * totalQuantity : 0,
      }));

      // Build an ILP (Integer Linear Programming) in CPLEX .lp format (IBM Standard) for HiGHS:
      //  Variables:
      //    - x_i_p ∈ {0,1}: assign each line item, i, to exactly one partner, p
      //    - dpos_p, dneg_p ≥ 0: linearize absolute deviation from partner p's target
      //  Objective:
      //     Minimize Σ_p (dpos_p + dneg_p) => L1 deviation from desired totals
      //  Constraints:
      //    - For each item i: Σ_p x_i_p = 1 (assign to exactly one partner)
      //    - For each partner p: Σ_i (q_i * x_i_p) - dpos_p + dneg_p = target_p where q_i is the line item’s quantity

      const itemCount = lineItems.length;
      const partnerCount = targets.length;

      // Map indices for stable variable names (use small integers instead of large ids)
      const itemIndex = new Map<number, number>();
      lineItems.forEach((li, idx) => itemIndex.set(li.lineItemId, idx));
      const partnerIndex = new Map<number, number>();
      targets.forEach((t, idx) => partnerIndex.set(t.partnerId, idx));

      // Helpers to build variable names in the LP text
      const variableX = (iIdx: number, pIdx: number) => `x_i${iIdx}_p${pIdx}`;
      const variableDevPos = (pIdx: number) => `dpos_p${pIdx}`;
      const variableDevNeg = (pIdx: number) => `dneg_p${pIdx}`;

      // LP text builder (CPLEX .lp IBM format)
      const lines: string[] = [];

      // Objective: minimize sum_p (dpos_p + dneg_p) (L1 deviation from desired totals)
      lines.push("Minimize");
      lines.push(" obj:");
      if (partnerCount === 0) {
        // No partners to allocate to; skip this general item
        continue;
      }
      const objectiveTerms: string[] = [];
      for (let p = 0; p < partnerCount; p++) {
        objectiveTerms.push(variableDevPos(p));
        objectiveTerms.push(variableDevNeg(p));
      }
      lines.push("    " + objectiveTerms.join(" + "));

      // Constraints: each line item assigned to exactly one partner
      lines.push("Subject To");
      for (let itemIdx = 0; itemIdx < itemCount; itemIdx++) {
        const terms: string[] = [];
        for (let partnerIdx = 0; partnerIdx < partnerCount; partnerIdx++) {
          terms.push(variableX(itemIdx, partnerIdx));
        }
        lines.push(` assign_i${itemIdx}: ` + terms.join(" + ") + " = 1");
      }

      // Balance constraints per partner: Σ_i (q_i * x_i_p) - dpos_p + dneg_p = target_p
      for (let partnerIdx = 0; partnerIdx < partnerCount; partnerIdx++) {
        const t = targets[partnerIdx];
        const terms: string[] = [];
        for (let itemIdx = 0; itemIdx < itemCount; itemIdx++) {
          const q = lineItems[itemIdx].quantity;
          terms.push(`${q} ${variableX(itemIdx, partnerIdx)}`);
        }
        terms.push(`- ${variableDevPos(partnerIdx)}`);
        terms.push(`+ ${variableDevNeg(partnerIdx)}`);
        lines.push(` balance_p${partnerIdx}: ` + terms.join(" ") + ` = ${t.target}`);
      }

      // Bounds section: dpos_p, dneg_p ≥ 0 (x variables will be declared binary below)
      lines.push("Bounds");
      for (let partnerIdx = 0; partnerIdx < partnerCount; partnerIdx++) {
        lines.push(` 0 <= ${variableDevPos(partnerIdx)}`);
        lines.push(` 0 <= ${variableDevNeg(partnerIdx)}`);
      }

      // Declare binary variables x_i_p
      lines.push("Binaries");
      const binaries: string[] = [];
      for (let itemIdx = 0; itemIdx < itemCount; itemIdx++) {
        for (let partnerIdx = 0; partnerIdx < partnerCount; partnerIdx++) {
          binaries.push(variableX(itemIdx, partnerIdx));
        }
      }

      // End of LP
      lines.push("End");

      // Final LP model text
      const lp = lines.join("\n");

      const highs = await highsLoader({ locateFile: (f) => path.join(process.cwd(), "node_modules/highs/build", f) });
      const solution = highs.solve(lp, {
        presolve: "on",
        threads: 0, // auto
        time_limit: 10, // seconds safeguard
      });

      if (!solution || solution.Status !== "Optimal") {
        throw new InternalError("Unable to solve problem optimally");
      }

      // Extract assignment variables x_i_p from the solution and build allocations

      // For each item, pick the partner with x_i_p ≈ 1
      // If none exceeds 0.5 due to tolerance, choose the partner with the highest value.
      for (let itemIdx = 0; itemIdx < itemCount; itemIdx++) {
        let chosenPartnerIdx: number | null = null;
        for (let p = 0; p < partnerCount; p++) {
          const varName = variableX(itemIdx, p);
          const col = solution.Columns[varName];
          const val = col?.Primal ?? 0;
          if (val > 0.5) {
            chosenPartnerIdx = p;
            break;
          }
        }

        // If no partner strictly selected (due to tolerance), choose the one with max value
        if (chosenPartnerIdx === null) {
          let maxVal = -Infinity;
          let maxIdx = 0;
          for (let partnerIdx = 0; partnerIdx < partnerCount; partnerIdx++) {
            const varName = variableX(itemIdx, partnerIdx);
            const col = solution.Columns[varName];
            const val = col?.Primal ?? 0;
            if (val > maxVal) {
              maxVal = val;
              maxIdx = partnerIdx;
            }
          }
          chosenPartnerIdx = maxIdx;
        }

        const lineItem = lineItems[itemIdx];
        const partnerId = targets[chosenPartnerIdx].partnerId;
        allAllocations.push({ lineItemId: lineItem.lineItemId, quantity: lineItem.quantity, partnerId });
      }
    }

    return NextResponse.json({ allocations: allAllocations });
  } catch (error) {
    return errorResponse(error);
  }
}
