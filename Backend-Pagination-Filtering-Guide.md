# Backend Pagination & Filtering Guide

## Overview

When implementing pagination and filtering for the AdvancedBaseTable, you need to handle 3 key parameters and use 2 helper functions.

## The 3 Required Parameters

The frontend sends 3 parameters that you must parse:

1. **`filters`** - JSON string containing filter criteria
2. **`page`** - Current page number (1-based)
3. **`pageSize`** - Number of items per page

You get these using `tableParamsSchema` which validates and parses them automatically.

## The 2 Helper Functions

In your service methods, you use these utility functions:

1. **`buildWhereFromFilters()`** - Converts frontend filters into Prisma WHERE clauses
2. **`buildQueryWithPagination()`** - Adds `take` and `skip` to your Prisma query

## Response Format

Always return your data in this exact format:
```typescript
{ entityName: T[], total: number }
```

The `total` count is required for the frontend to calculate pagination properly.

## Implementation

### API Route

```typescript
export async function GET(request: NextRequest) {
  try {
    // Parse the 3 required params
    const parsed = tableParamsSchema.safeParse({
      filters: request.nextUrl.searchParams.get("filters"),
      page: request.nextUrl.searchParams.get("page"),
      pageSize: request.nextUrl.searchParams.get("pageSize"),
    });

    if (!parsed.success) {
      throw new ArgumentError(parsed.error.message);
    }

    const { filters, page, pageSize } = parsed.data;

    // Call your service
    const { users, total } = await UserService.getUsers(
      filters ?? undefined,
      page ?? undefined,
      pageSize ?? undefined
    );

    return NextResponse.json({ users, total }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
```

### Service Method

```typescript
static async getUsers(filters?: Filters, page?: number, pageSize?: number) {
  // Use the helper functions
  const where = buildWhereFromFilters<Prisma.UserWhereInput>(
    Object.keys(Prisma.UserScalarFieldEnum),
    filters
  );

  const query: Prisma.UserFindManyArgs = { where };

  buildQueryWithPagination(query, page, pageSize);

  const [users, total] = await Promise.all([
    db.user.findMany(query),
    db.user.count({ where }),
  ]);

  return { users, total };
}
```

## Key Points

- **Parameters**: Always parse `filters`, `page`, `pageSize` using `tableParamsSchema`
- **Where Clause**: Use `buildWhereFromFilters()` to convert filters to Prisma WHERE
- **Pagination**: Use `buildQueryWithPagination()` to add take/skip to your query
- **Response**: Always return `{ entityName: T[], total: number }` format
- **Parallel Queries**: Run `findMany()` and `count()` in parallel for better performance