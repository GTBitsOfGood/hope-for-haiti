# AdvancedBaseTable Implementation Guide

The `AdvancedBaseTable` is a powerful, feature-rich table component that provides pagination, filtering, sorting, and data management capabilities with a clean API.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Props Reference](#props-reference)
- [Column Definitions](#column-definitions)
- [Ref Usage & Methods](#ref-usage--methods)
- [Advanced Features](#advanced-features)
- [Complete Examples](#complete-examples)

## Basic Usage

```tsx
import { useRef, useCallback } from "react";
import AdvancedBaseTable from "@/components/baseTable/AdvancedBaseTable";
import { AdvancedBaseTableHandle, ColumnDefinition, FilterList } from "@/types/ui/table.types";
import { useApiClient } from "@/hooks/useApiClient";

interface User {
  id: number;
  name: string;
  email: string;
  type: 'ADMIN' | 'STAFF' | 'PARTNER';
  tag: string;
  enabled: boolean;
  pending: boolean;
}

const MyComponent = () => {
  const tableRef = useRef<AdvancedBaseTableHandle<User>>(null);
  const { apiClient } = useApiClient();

  const fetchUsers = useCallback(async (
    pageSize: number, 
    page: number, 
    filters: FilterList<User>
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      filters: JSON.stringify(filters),
    });
    
    const data = await apiClient.get<{ users: User[], total: number }>(`/api/users?${params}`);
    return {
      data: data.users,
      total: data.total,
    };
  }, [apiClient]);

  const columns: ColumnDefinition<User>[] = [
    'name',
    'email',
    {
      id: 'type',
      header: 'Role', // a capitalized ID is used if no header is provided
      cell: (user) => user.type.toLowerCase(),
    },
    {
      id: 'tag',
      cell: (user) -> <Tag>{user.tag}</Tag>,
      filterType: 'enum',
      filterOptions: ['tag1', 'tag2'] // even though tag is defined as string, can customly define filter type
    }
    {
      id: 'status',
      cell: (user) => user.pending ? 'Pending' : user.enabled ? 'Active' : 'Inactive'
    }
  ];

  return (
    <AdvancedBaseTable
      ref={tableRef}
      columns={columns}
      fetchFn={fetchUsers}
      rowId="id"
      pageSize={25}
    />
  );
};
```

## Props Reference

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `columns` | `ColumnDefinition<T>[]` | Array of column definitions (see [Column Definitions](#column-definitions)) |
| `fetchFn` | `(pageSize: number, page: number, filters: FilterList<T>) => Promise<TableQuery<T>>` | Function to fetch data from your API |
| `rowId` | `RowIdAccessor<T>` | Key or function to identify unique rows |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pageSize` | `number` | `20` | Number of items per page |
| `headerClassName` | `string` | `"bg-gray-primary/5 text-gray-primary/70 border-b-2 border-gray-primary/10"` | CSS classes for table header row |
| `headerCellStyles` | `string` | `undefined` | CSS classes for individual header cells |
| `rowCellStyles` | `string` | `undefined` | CSS classes for individual data cells |
| `onRowClick` | `(item: T) => void` | `undefined` | Callback when a row is clicked |
| `rowClassName` | `(item: T, index: number) => string \| undefined` | `undefined` | Function to determine row CSS classes |
| `emptyState` | `React.ReactNode` | `"No results found."` | Content to show when no data |
| `toolBar` | `React.ReactNode` | `undefined` | Custom toolbar content (renders before filter button) |
| `rowBody` | `(item: T) => React.ReactNode \| undefined` | `undefined` | Function to render additional row content below each row |

## Column Definitions

Columns can be defined in two ways:

### Simple Column (Property Access)
```tsx
const columns: ColumnDefinition<User>[] = [
  'id',        // Uses property directly, auto-generates header "Id"
  'name',      // Uses property directly, auto-generates header "Name"
  'email'      // Uses property directly, auto-generates header "Email"
];
```

### Advanced Column (Custom Configuration)
```tsx
const columns: ColumnDefinition<User>[] = [
  {
    id: 'id',
    header: 'User ID',
    cell: (user, index) => `#${user.id}`,
    headerClassName: 'w-20',
    cellClassName: 'font-mono text-sm',
    filterType: 'number',           // Enable number filtering
    filterOptions: ['1', '2', '3']  // Predefined filter options
  },
  {
    id: 'name',
    header: 'Full Name',
    cell: (user) => (
      <div className="flex items-center gap-2">
        <Avatar src={user.avatar} />
        <span>{user.name}</span>
      </div>
    ),
    filterType: 'string'  // Enable text search
  },
  {
    id: 'createdAt',
    header: 'Member Since',
    cell: (user) => new Date(user.createdAt).toLocaleDateString(),
    filterType: 'date'  // Enable date range filtering
  },
  {
    id: 'role',
    header: 'Role',
    cell: (user) => (
      <Badge variant={user.role === 'admin' ? 'success' : 'default'}>
        {user.role}
      </Badge>
    ),
    filterType: 'enum',           // Enable dropdown filtering
    filterOptions: ['admin', 'user', 'moderator']
  }
];
```

### Column Configuration Options

| Property | Type | Description |
|----------|------|-------------|
| `id` | `keyof T \| string` | Property name or custom identifier |
| `header` | `React.ReactNode` | Custom header content (defaults to humanized property name) |
| `cell` | `(item: T, index: number) => React.ReactNode` | Custom cell renderer |
| `headerClassName` | `string` | CSS classes for header cell |
| `cellClassName` | `string` | CSS classes for data cells |
| `filterType` | `'string' \| 'number' \| 'date' \| 'enum'` | Enable filtering for this column |
| `filterOptions` | `string[]` | Predefined options for enum filters |

## Ref Usage & Methods

The `AdvancedBaseTableHandle<T>` provides several methods for programmatic control:

### Getting a Ref
```tsx
const tableRef = useRef<AdvancedBaseTableHandle<User>>(null);
```

### Available Methods

#### `reload()`
Reloads the current page with current filters.

```tsx
const handleRefresh = () => {
  tableRef.current?.reload();
};
```

#### `setItems(value)`
Updates the table items directly.

```tsx
// Set items directly
const handleSetItems = (newUsers: User[]) => {
  tableRef.current?.setItems(newUsers);
};

// Update items with function
const handleAddUser = (newUser: User) => {
  tableRef.current?.setItems(prev => [...prev, newUser]);
};

// Clear items
const handleClearItems = () => {
  tableRef.current?.setItems([]);
};
```

#### `upsertItem(item)`
Adds or updates an item in the table.

```tsx
const handleSaveUser = (user: User) => {
  tableRef.current?.upsertItem(user);
  // If user exists, it updates; if not, it adds to current page
};
```

#### `removeItemById(id)`
Removes an item by its ID.

```tsx
const handleDeleteUser = (userId: number) => {
  tableRef.current?.removeItemById(userId);
};
```

#### `updateItemById(id, updater)`
Updates a specific item by ID.

```tsx
// Update with partial object
const handleUpdateUser = (userId: number, updates: Partial<User>) => {
  tableRef.current?.updateItemById(userId, updates);
};

// Update with function
const handleToggleRole = (userId: number) => {
  tableRef.current?.updateItemById(userId, (currentUser) => ({
    ...currentUser,
    role: currentUser.role === 'admin' ? 'user' : 'admin'
  }));
};
```

## Advanced Features

### Custom Toolbar
Add custom actions before the filter button:

```tsx
const toolbar = (
  <div className="flex gap-2">
    <button 
      onClick={handleExport}
      className="px-3 py-1 bg-blue-500 text-white rounded"
    >
      Export CSV
    </button>
    <button 
      onClick={handleBulkDelete}
      className="px-3 py-1 bg-red-500 text-white rounded"
    >
      Bulk Delete
    </button>
  </div>
);

<AdvancedBaseTable
  // ... other props
  toolBar={toolbar}
/>
```

### Custom Row Styling
Apply different styles based on data:

```tsx
const rowClassName = (user: User, index: number) => {
  if (user.role === 'admin') return 'bg-blue-50';
  if (index % 2 === 0) return 'bg-gray-50';
  return undefined;
};

<AdvancedBaseTable
  // ... other props
  rowClassName={rowClassName}
/>
```

### Custom Empty State
Provide meaningful empty state content:

```tsx
const emptyState = (
  <div className="text-center py-12">
    <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
    <p className="mt-1 text-sm text-gray-500">
      Get started by creating a new user.
    </p>
    <button onClick={handleCreateUser} className="mt-4 btn btn-primary">
      Create User
    </button>
  </div>
);

<AdvancedBaseTable
  // ... other props
  emptyState={emptyState}
/>
```

## Complete Examples

### Basic Usage
```tsx
const UserTable = () => {
  const tableRef = useRef<AdvancedBaseTableHandle<User>>(null);
  const { apiClient } = useApiClient();

  const fetchUsers = useCallback(async (pageSize: number, page: number, filters: FilterList<User>) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      filters: JSON.stringify(filters),
    });
    
    const data = await apiClient.get<{ users: User[], total: number }>(`/api/users?${params}`);
    return { data: data.users, total: data.total };
  }, [apiClient]);

  const columns: ColumnDefinition<User>[] = [
    'name',
    'email',
    {
      id: 'type',
      header: 'Role',
      filterType: 'enum',
      filterOptions: ['ADMIN', 'STAFF', 'PARTNER']
    }
  ];

  return (
    <AdvancedBaseTable
      ref={tableRef}
      columns={columns}
      fetchFn={fetchUsers}
      rowId="id"
    />
  );
};
```

### Advanced Usage with Actions and Custom Styling
```tsx
const AccountManagementTable = () => {
  const tableRef = useRef<AdvancedBaseTableHandle<AccountUserResponse>>(null);
  const { apiClient } = useApiClient();
  
  const fetchFn = useCallback(async (pageSize: number, page: number, filters: FilterList<AccountUserResponse>) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      filters: JSON.stringify(filters),
    });
    
    const data = await apiClient.get<{ users: AccountUserResponse[], total: number }>(`/api/users?${params}`);
    return { data: data.users, total: data.total };
  }, [apiClient]);

  const handleDelete = async (user: AccountUserResponse) => {
    await apiClient.delete(`/api/users/${user.id}`);
    tableRef.current?.removeItemById(user.id);
  };

  const columns: ColumnDefinition<AccountUserResponse>[] = [
    'name',
    'email',
    {
      id: 'type',
      header: 'Role',
      filterType: 'enum',
      filterOptions: ['ADMIN', 'STAFF', 'PARTNER']
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item) => (
        <Badge variant={item.enabled ? 'success' : 'destructive'}>
          {item.enabled ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item) => (
        <button 
          onClick={() => handleDelete(item)}
          className="text-red-500 hover:bg-red-50 px-2 py-1 rounded"
        >
          Delete
        </button>
      )
    }
  ];

  const toolbar = (
    <button className="btn btn-primary">
      Add User
    </button>
  );

  return (
    <AdvancedBaseTable
      ref={tableRef}
      columns={columns}
      fetchFn={fetchFn}
      rowId="id"
      toolBar={toolbar}
      emptyState="No users found"
      onRowClick={(user) => router.push(`/users/${user.id}`)}
    />
  );
};
```

## Best Practices

### Required Dependencies
1. **Use `useApiClient` hook**: Always use the project's API client instead of raw `fetch()`
   ```tsx
   import { useApiClient } from '@/hooks/useApiClient';
   
   const { apiClient } = useApiClient();
   ```

2. **API Response Format**: Your API must return data in this specific format:
   ```typescript
   {
     users: T[],     // or whatever your collection is named
     total: number   // total count for pagination
   }
   ```

### Implementation Best Practices
1. **Use meaningful row IDs**: Ensure your `rowId` prop corresponds to a unique identifier in your data
2. **Memoize fetch functions**: Always wrap your `fetchFn` with `useCallback` and include `apiClient` in dependencies
3. **Handle loading states**: The table handles loading internally, but consider showing global loading states for better UX
4. **Customize styling**: Use the className props to match your design system
5. **Implement proper error handling**: Wrap your API calls in try-catch blocks
6. **Use TypeScript**: Always type your data interfaces and column definitions for better development experience
7. **URLSearchParams for API calls**: Use `URLSearchParams` to properly encode query parameters:
   ```tsx
   const params = new URLSearchParams({
     page: page.toString(),
     pageSize: pageSize.toString(),
     filters: JSON.stringify(filters),
   });
   ```
8. **Ref methods for updates**: Use table ref methods (`updateItemById`, `removeItemById`, `upsertItem`) instead of reloading after mutations for better UX

## Troubleshooting

### Common Issues

1. **"filter is not a function" error**: Ensure your API returns data in the format `{ data: T[], total: number }`
2. **Filters not working**: Check that your `filterType` matches the data type and `filterOptions` are provided for enum filters
3. **Pagination issues**: Verify your API handles `page` and `pageSize` parameters correctly
4. **Ref methods not working**: Ensure you're using the ref with the correct generic type: `AdvancedBaseTableHandle<YourDataType>`

### Performance Tips

1. **Debounce filter changes**: Implement debouncing in your fetch function for text filters
2. **Use server-side filtering**: Let your API handle filtering rather than client-side filtering
3. **Optimize column rendering**: Use `useMemo` for expensive cell renderers
4. **Limit page size**: Don't use extremely large page sizes (recommended: 20-100 items)
