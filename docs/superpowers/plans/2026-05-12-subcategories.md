# Subcategories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add subcategories (1 level deep, many-to-many) to the e-commerce platform, visible in filters, product cards, and admin.

**Architecture:** Self-referencing `categories` table via `parent_id` column. Junction table `product_subcategories` handles product↔subcategory many-to-many. Backend returns hierarchical category tree; frontend filter panel reveals subcategory pills when a root category is selected.

**Tech Stack:** Flask + PyMySQL (backend), React 18 + TypeScript + shadcn/ui + Tailwind (frontend), MySQL (alwaysdata.net remote DB).

> **Note on tests:** This project has no test framework configured. Each task includes manual verification via `curl` (backend) or browser (frontend) instead of automated tests. Verify each step before committing.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `backend/migrate_subcategories.py` | Create | One-time migration script |
| `backend/routes/categories.py` | Modify | Hierarchical GET, parent_id in POST/PUT, delete guard |
| `backend/routes/products.py` | Modify | Subcategory filter param, subcategories in response, subcategory_ids in PUT/POST |
| `src/types/index.ts` | Modify | Add `subcategories` to Category and Product |
| `src/lib/api.ts` | Modify | Add `subcategory` to ProductFilters, wire param |
| `src/pages/Products.tsx` | Modify | Subcategory filter pills + active badge |
| `src/components/ProductCard.tsx` | Modify | Subcategory pills below category badge |
| `src/pages/admin/CategoriesManagement.tsx` | Modify | Grouped table, parent_id form field, delete guard |
| `src/pages/admin/ProductsManagement.tsx` | Modify | Subcategory multi-select in product form |

---

## Task 1: Database Migration

**Files:**
- Create: `backend/migrate_subcategories.py`

- [ ] **Step 1: Create migration script**

Create `backend/migrate_subcategories.py`:

```python
import pymysql
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from config import Config

def run():
    conn = pymysql.connect(
        host=Config.DATABASE_HOST,
        user=Config.DATABASE_USER,
        password=Config.DATABASE_PASSWORD,
        database=Config.DATABASE_NAME,
        port=Config.DATABASE_PORT
    )
    try:
        with conn.cursor() as cur:
            cur.execute("SHOW COLUMNS FROM categories LIKE 'parent_id'")
            if not cur.fetchone():
                cur.execute("ALTER TABLE categories ADD COLUMN parent_id VARCHAR(36) NULL")
                cur.execute(
                    "ALTER TABLE categories ADD CONSTRAINT fk_category_parent "
                    "FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE"
                )
                cur.execute("ALTER TABLE categories ADD INDEX idx_parent (parent_id)")
                print("parent_id column added to categories")
            else:
                print("parent_id already exists, skipping")

            cur.execute("""
                CREATE TABLE IF NOT EXISTS product_subcategories (
                    product_id VARCHAR(36) NOT NULL,
                    subcategory_id VARCHAR(36) NOT NULL,
                    PRIMARY KEY (product_id, subcategory_id),
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                    FOREIGN KEY (subcategory_id) REFERENCES categories(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            print("product_subcategories table created (or already exists)")
        conn.commit()
        print("Migration complete.")
    except Exception as e:
        conn.rollback()
        print(f"Migration FAILED: {e}")
        raise
    finally:
        conn.close()

if __name__ == '__main__':
    run()
```

- [ ] **Step 2: Run migration**

```bash
cd backend
python migrate_subcategories.py
```

Expected output:
```
parent_id column added to categories
product_subcategories table created (or already exists)
Migration complete.
```

- [ ] **Step 3: Verify schema**

```bash
cd backend
python -c "
from utils.database import execute_query
cols = execute_query('SHOW COLUMNS FROM categories', fetch_all=True)
print([c['Field'] for c in cols])
tables = execute_query(\"SHOW TABLES LIKE 'product_subcategories'\", fetch_all=True)
print('product_subcategories exists:', len(tables) > 0)
"
```

Expected: `['id', 'name', 'slug', 'icon', 'product_count', 'parent_id']` and `product_subcategories exists: True`

- [ ] **Step 4: Commit**

```bash
git add backend/migrate_subcategories.py
git commit -m "feat: add subcategories DB migration script"
```

---

## Task 2: Backend — categories.py

**Files:**
- Modify: `backend/routes/categories.py`

- [ ] **Step 1: Replace `get_categories` with hierarchical version**

Replace the entire `get_categories` function (lines 71-95) with:

```python
@bp.route('', methods=['GET'])
def get_categories():
    """Get all categories with hierarchical structure"""
    try:
        rows = execute_query(
            """SELECT c.id, c.name, c.slug, c.icon, c.parent_id,
                  CASE
                      WHEN c.parent_id IS NULL THEN
                          (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id)
                      ELSE
                          (SELECT COUNT(*) FROM product_subcategories ps WHERE ps.subcategory_id = c.id)
                  END as product_count
               FROM categories c
               ORDER BY c.parent_id IS NOT NULL, c.name""",
            fetch_all=True
        )

        sub_map = {}
        root_list = []

        for c in rows:
            entry = {
                'id': c['id'],
                'name': c['name'],
                'slug': c['slug'],
                'icon': c['icon'],
                'productCount': c['product_count'],
                'parentId': c['parent_id'],
            }
            if c['parent_id']:
                sub_map.setdefault(c['parent_id'], []).append(entry)
            else:
                root_list.append(entry)

        for cat in root_list:
            cat['subcategories'] = sub_map.get(cat['id'], [])

        return jsonify(root_list), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

- [ ] **Step 2: Update `create_category` to accept `parent_id`**

Replace the body of `create_category` (lines 98-138) with:

```python
@bp.route('', methods=['POST'])
@admin_required
def create_category(current_user):
    """Create a new category or subcategory (admin only)"""
    try:
        data = request.get_json()

        name = data.get('name', '').strip()
        if not name:
            return jsonify({'error': 'Le nom est requis'}), 400

        icon = data.get('icon', 'Folder')
        parent_id = data.get('parent_id') or None

        if parent_id:
            parent = execute_query(
                "SELECT id FROM categories WHERE id = %s AND parent_id IS NULL",
                (parent_id,),
                fetch_one=True
            )
            if not parent:
                return jsonify({'error': 'Catégorie parente invalide'}), 400

        base_slug = generate_slug(name)
        unique_slug = ensure_unique_slug(base_slug)
        category_id = str(uuid.uuid4())

        execute_query(
            "INSERT INTO categories (id, name, slug, icon, parent_id) VALUES (%s, %s, %s, %s, %s)",
            (category_id, name, unique_slug, icon, parent_id),
            commit=True
        )

        return jsonify({
            'id': category_id,
            'message': 'Catégorie créée avec succès',
            'category': {
                'id': category_id,
                'name': name,
                'slug': unique_slug,
                'icon': icon,
                'parentId': parent_id
            }
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

- [ ] **Step 3: Update `update_category` to accept `parent_id`**

Replace the `execute_query` UPDATE call inside `update_category` (line 174-178) with:

```python
        parent_id = data.get('parent_id', category.get('parent_id'))
        if parent_id == '':
            parent_id = None

        execute_query(
            "UPDATE categories SET name = %s, slug = %s, icon = %s, parent_id = %s WHERE id = %s",
            (name, unique_slug, icon, parent_id, category_id),
            commit=True
        )
```

And update the return value to include `parentId`:

```python
        return jsonify({
            'message': 'Catégorie mise à jour avec succès',
            'category': {
                'id': category_id,
                'name': name,
                'slug': unique_slug,
                'icon': icon,
                'parentId': parent_id
            }
        }), 200
```

- [ ] **Step 4: Update `delete_category` to block if has subcategories**

Add subcategory check inside `delete_category` after the product_count check (after line 219):

```python
        # Block delete if has subcategories
        subcategory_count = execute_query(
            "SELECT COUNT(*) as count FROM categories WHERE parent_id = %s",
            (category_id,),
            fetch_one=True
        )
        if subcategory_count['count'] > 0:
            return jsonify({
                'error': f'Impossible de supprimer cette catégorie car elle a {subcategory_count["count"]} sous-catégorie(s)'
            }), 400
```

- [ ] **Step 5: Verify with curl**

Start the backend first: `cd backend && python app.py`

```bash
# Create root category
curl -s -X POST http://localhost:8000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"name": "Test Root", "icon": "Folder"}' | python -m json.tool

# Note the id returned, use it as parent_id below
curl -s -X POST http://localhost:8000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"name": "Test Sub", "icon": "Folder", "parent_id": "<root_id>"}' | python -m json.tool

# GET should return nested structure
curl -s http://localhost:8000/api/categories | python -m json.tool
```

Expected: GET returns root categories each with a `subcategories` array. "Test Root" contains "Test Sub".

- [ ] **Step 6: Commit**

```bash
git add backend/routes/categories.py
git commit -m "feat: add subcategory support to categories API"
```

---

## Task 3: Backend — products.py

**Files:**
- Modify: `backend/routes/products.py`

- [ ] **Step 1: Add subcategory filter to `get_products`**

Add after line 36 (`in_stock = ...`):

```python
    subcategory = request.args.get('subcategory')
```

Add after the `in_stock` condition block (after line 66):

```python
    if subcategory:
        conditions.append("""p.id IN (
            SELECT ps.product_id FROM product_subcategories ps
            JOIN categories sc ON ps.subcategory_id = sc.id
            WHERE sc.slug = %s
        )""")
        params.append(subcategory)
```

- [ ] **Step 2: Add `subcategories` to `get_products` formatted response**

After building `formatted_products` in the loop (after the `sizes_list` line), fetch subcategories per product in bulk. Replace the `formatted_products.append({...})` block with one that includes subcategories:

Add before the loop:
```python
    # Fetch all product_subcategories for the current page in one query
    product_ids = [p['id'] for p in products]
    subcategories_by_product = {}
    if product_ids:
        placeholders = ', '.join(['%s'] * len(product_ids))
        sub_rows = execute_query(
            f"""SELECT ps.product_id, c.id, c.name, c.slug
                FROM product_subcategories ps
                JOIN categories c ON ps.subcategory_id = c.id
                WHERE ps.product_id IN ({placeholders})""",
            tuple(product_ids),
            fetch_all=True
        )
        for row in (sub_rows or []):
            subcategories_by_product.setdefault(row['product_id'], []).append({
                'id': row['id'],
                'name': row['name'],
                'slug': row['slug']
            })
```

In `formatted_products.append({...})`, add after `'sizes': sizes_list`:
```python
            'subcategories': subcategories_by_product.get(p['id'], []),
```

- [ ] **Step 3: Add `subcategories` to `get_product` (single product)**

In `get_product`, after fetching the product and before the return statement, add:

```python
    subcategories = execute_query(
        """SELECT c.id, c.name, c.slug
           FROM categories c
           JOIN product_subcategories ps ON c.id = ps.subcategory_id
           WHERE ps.product_id = %s""",
        (product_id,),
        fetch_all=True
    )
```

Add to the return jsonify dict after `'sizes': sizes_list`:
```python
        'subcategories': [{'id': s['id'], 'name': s['name'], 'slug': s['slug']} for s in (subcategories or [])],
```

- [ ] **Step 4: Handle `subcategory_ids` in `create_product`**

In `create_product`, after the main `execute_query` INSERT call (after line 260, after `commit=True`), add:

```python
    subcategory_ids = data.get('subcategory_ids', [])
    if subcategory_ids:
        from utils.database import get_db_connection
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.executemany(
                    "INSERT IGNORE INTO product_subcategories (product_id, subcategory_id) VALUES (%s, %s)",
                    [(product_id, sid) for sid in subcategory_ids]
                )
            conn.commit()
        finally:
            conn.close()
```

- [ ] **Step 5: Handle `subcategory_ids` in `update_product`**

In `update_product`, after the main `execute_query(query, ...)` call (the UPDATE, after line 334), add:

```python
    if 'subcategory_ids' in data:
        from utils.database import get_db_connection
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM product_subcategories WHERE product_id = %s", (product_id,))
                subcategory_ids = data['subcategory_ids']
                if subcategory_ids:
                    cur.executemany(
                        "INSERT INTO product_subcategories (product_id, subcategory_id) VALUES (%s, %s)",
                        [(product_id, sid) for sid in subcategory_ids]
                    )
            conn.commit()
        finally:
            conn.close()
```

- [ ] **Step 6: Verify with curl**

```bash
# Test subcategory filter (use a real subcategory slug from Task 2)
curl -s "http://localhost:8000/api/products?subcategory=test-sub" | python -m json.tool

# Test single product includes subcategories
curl -s "http://localhost:8000/api/products/<any_product_id>" | python -m json.tool
# Should see "subcategories": [] in response
```

- [ ] **Step 7: Commit**

```bash
git add backend/routes/products.py
git commit -m "feat: add subcategory filter and subcategories field to products API"
```

---

## Task 4: TypeScript Types + API Client

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/lib/api.ts`

- [ ] **Step 1: Update `Category` interface in `src/types/index.ts`**

Replace the `Category` interface (lines 38-46):

```typescript
// ==================== CATEGORY ====================
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  productCount?: number;
  parentId?: string;
  subcategories?: Category[];
}
```

- [ ] **Step 2: Update `Product` interface in `src/types/index.ts`**

Add after `sizes?: string[];` (line 35):

```typescript
  subcategories?: { id: string; name: string; slug: string }[];
```

- [ ] **Step 3: Add `subcategory` to `ProductFilters` in `src/lib/api.ts`**

Replace the `ProductFilters` interface (lines 258-266):

```typescript
export interface ProductFilters {
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  inStock?: boolean;
  page?: number;
  limit?: number;
}
```

- [ ] **Step 4: Wire `subcategory` param in `getProducts` in `src/lib/api.ts`**

After `if (filters?.category) params.append('category', filters.category);` (line 272), add:

```typescript
  if (filters?.subcategory) params.append('subcategory', filters.subcategory);
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd c:/Dev/E-commerce
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/lib/api.ts
git commit -m "feat: add subcategory types and API param"
```

---

## Task 5: Products.tsx — Subcategory Filter

**Files:**
- Modify: `src/pages/Products.tsx`

- [ ] **Step 1: Add `selectedSubcategory` state**

After `const [sortBy, setSortBy] = useState<string>('newest');` (line 57), add:

```typescript
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
```

- [ ] **Step 2: Add `subcategory` to `loadProducts` API call**

In `loadProducts`, in the `getProducts({...})` call, add after `inStock: inStockOnly || undefined,`:

```typescript
        subcategory: selectedSubcategory || undefined,
```

- [ ] **Step 3: Add `selectedSubcategory` to `useEffect` dependencies**

Replace the `useEffect` dependency array (line 65):

```typescript
  }, [currentPage, selectedCategory, priceRange, inStockOnly, searchParams, selectedSubcategory]);
```

- [ ] **Step 4: Reset subcategory when category changes**

Replace `handleCategoryChange` (lines 134-137):

```typescript
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory('');
    setCurrentPage(1);
  };
```

- [ ] **Step 5: Include `selectedSubcategory` in `resetFilters`**

After `setSortBy('newest');` inside `resetFilters` (line 149), add:

```typescript
    setSelectedSubcategory('');
```

- [ ] **Step 6: Add subcategory to `hasActiveFilters`**

Replace `hasActiveFilters` (lines 154-159):

```typescript
  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedSubcategory !== '' ||
    priceRange[0] > 0 ||
    priceRange[1] < 500000 ||
    inStockOnly ||
    searchQuery;
```

- [ ] **Step 7: Add subcategory pills to `FilterContent`**

Add the following block inside `FilterContent`, immediately after the closing `</div>` of the Category Filter section (after line 179):

```tsx
      {/* Subcategory Pills */}
      {selectedCategory !== 'all' && (() => {
        const activeCat = categories.find(c => c.slug === selectedCategory);
        const subs = activeCat?.subcategories ?? [];
        if (subs.length === 0) return null;
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Sous-catégorie</Label>
            <div className="flex flex-wrap gap-2">
              {subs.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => {
                    setSelectedSubcategory(selectedSubcategory === sub.slug ? '' : sub.slug);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    selectedSubcategory === sub.slug
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:bg-muted'
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          </div>
        );
      })()}
```

- [ ] **Step 8: Add active subcategory badge**

In the "Active Filters Pills" section, after the category badge block (after line 310), add:

```tsx
          {selectedSubcategory && (() => {
            const activeCat = categories.find(c => c.slug === selectedCategory);
            const subName = activeCat?.subcategories?.find(s => s.slug === selectedSubcategory)?.name;
            return (
              <Badge variant="secondary" className="gap-2">
                Sous-cat: {subName}
                <button onClick={() => setSelectedSubcategory('')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })()}
```

- [ ] **Step 9: Verify in browser**

Start frontend: `npm run dev`

1. Go to `/products`
2. Select a category that has subcategories (created in Task 2 testing)
3. Subcategory pills appear below the category select
4. Click a pill → products filter
5. Active badge appears with X to remove
6. Changing category resets subcategory selection
7. "Réinitialiser" clears subcategory

- [ ] **Step 10: Commit**

```bash
git add src/pages/Products.tsx
git commit -m "feat: add subcategory filter pills to products page"
```

---

## Task 6: ProductCard.tsx — Subcategory Pills

**Files:**
- Modify: `src/components/ProductCard.tsx`

- [ ] **Step 1: Add subcategory pills after category/brand row**

In the INFOS section, find the `{(product.category || product.brand) && (` block (lines 223-234). Immediately after its closing `)}`, add:

```tsx
            {/* Subcategory pills */}
            {product.subcategories && product.subcategories.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {product.subcategories.slice(0, 2).map((sub) => (
                  <span
                    key={sub.id}
                    className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs"
                  >
                    {sub.name}
                  </span>
                ))}
                {product.subcategories.length > 2 && (
                  <span className="text-xs text-muted-foreground">
                    +{product.subcategories.length - 2} autres
                  </span>
                )}
              </div>
            )}
```

- [ ] **Step 2: Verify in browser**

1. In admin, assign subcategories to a product (Task 8 needed, or use curl):

```bash
curl -s -X PUT http://localhost:8000/api/products/<product_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"subcategory_ids": ["<subcategory_id>"]}' | python -m json.tool
```

2. Reload product list → subcategory pills appear on card below category badge

- [ ] **Step 3: Commit**

```bash
git add src/components/ProductCard.tsx
git commit -m "feat: display subcategory pills on product card"
```

---

## Task 7: CategoriesManagement.tsx — Admin

**Files:**
- Modify: `src/pages/admin/CategoriesManagement.tsx`

- [ ] **Step 1: Read current file structure**

Read lines 80-200 of `src/pages/admin/CategoriesManagement.tsx` to understand formData and table rendering.

- [ ] **Step 2: Add `parent_id` to formData state**

Find the `formData` state initialization (search for `useState({` after `setFormData`). Add `parentId: ''` to the initial state object and to every `setFormData({...})` reset call.

In the formData type (if typed inline), add `parentId: string`.

- [ ] **Step 3: Add "Catégorie parente" dropdown to the create/edit form**

In the form Dialog, after the icon field, add:

```tsx
                <div className="space-y-2">
                  <Label>Catégorie parente (optionnel)</Label>
                  <Select
                    value={formData.parentId || 'none'}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, parentId: v === 'none' ? '' : v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Aucune (catégorie racine)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune (catégorie racine)</SelectItem>
                      {categories
                        .filter((c) => !c.parentId && c.id !== editingCategory?.id)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
```

- [ ] **Step 4: Include `parentId` in create/update API call**

Find where `createCategory(formData)` or `updateCategory(id, formData)` is called. Ensure the payload includes `parent_id`:

```typescript
const payload = {
  name: formData.name,
  icon: formData.icon,
  parent_id: formData.parentId || null,
};
// then: createCategory(payload) / updateCategory(id, payload)
```

- [ ] **Step 5: Group table rows — root categories with indented subcategories**

Find the table body rendering (the `.map()` over categories). Replace with:

```tsx
{categories
  .filter((c) => !c.parentId)
  .map((rootCat) => (
    <>
      <TableRow key={rootCat.id}>
        {/* existing cells for rootCat */}
        ...
      </TableRow>
      {(rootCat.subcategories ?? []).map((sub) => (
        <TableRow key={sub.id} className="bg-muted/30">
          <TableCell className="pl-10 text-muted-foreground">
            ↳ {sub.name}
          </TableCell>
          {/* remaining cells for sub */}
          ...
        </TableRow>
      ))}
    </>
  ))}
```

Keep all existing cell content (icon, slug, productCount, edit/delete buttons) — just indent subcategory rows.

- [ ] **Step 6: Pre-populate `parentId` when editing a subcategory**

In the `handleEditCategory` (or wherever `setFormData` is called for editing), add:

```typescript
parentId: category.parentId || '',
```

- [ ] **Step 7: Verify in browser**

1. Go to admin → Categories
2. Create a subcategory with parent → appears indented below parent in table
3. Edit subcategory → parent dropdown pre-filled
4. Try deleting parent that has subcategory → error toast shown
5. Delete subcategory first → then parent deletes successfully

- [ ] **Step 8: Commit**

```bash
git add src/pages/admin/CategoriesManagement.tsx
git commit -m "feat: add parent_id support and grouped table to categories admin"
```

---

## Task 8: ProductsManagement.tsx — Subcategory Multi-Select

**Files:**
- Modify: `src/pages/admin/ProductsManagement.tsx`

- [ ] **Step 1: Add `subcategoryIds` to formData state**

In the `formData` useState (line 98), add:

```typescript
    subcategoryIds: [] as string[],
```

Add `subcategoryIds: []` to every `setFormData` reset call in the file.

- [ ] **Step 2: Pre-populate `subcategoryIds` when editing a product**

In `handleOpenDialog(product)`, after `sizes: (product.sizes ?? []).join(', ')`, add:

```typescript
        subcategoryIds: (product.subcategories ?? []).map((s) => s.id),
```

- [ ] **Step 3: Add subcategory multi-select to the product form**

Find the category Select in the form Dialog. After it, add:

```tsx
                {/* Subcategory multi-select — shown when category has subcategories */}
                {(() => {
                  const activeCat = categories.find(
                    (c) => c.slug === formData.category
                  );
                  const subs = activeCat?.subcategories ?? [];
                  if (subs.length === 0) return null;
                  return (
                    <div className="space-y-2">
                      <Label>Sous-catégories</Label>
                      <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[44px]">
                        {subs.map((sub) => {
                          const selected = formData.subcategoryIds.includes(sub.id);
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  subcategoryIds: selected
                                    ? prev.subcategoryIds.filter((id) => id !== sub.id)
                                    : [...prev.subcategoryIds, sub.id],
                                }))
                              }
                              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                                selected
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-background border-border hover:bg-muted'
                              }`}
                            >
                              {sub.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
```

- [ ] **Step 4: Reset subcategoryIds when category changes**

Find the category Select's `onValueChange` in the form. Add `subcategoryIds: []` reset:

```typescript
onValueChange={(v) => setFormData((prev) => ({ ...prev, category: v, subcategoryIds: [] }))}
```

- [ ] **Step 5: Include `subcategory_ids` in create/update payload**

Find where `createProduct(payload)` and `updateProduct(id, payload)` are called. Add `subcategory_ids: formData.subcategoryIds` to the payload object in both cases.

- [ ] **Step 6: Verify in browser**

1. Go to admin → Products → create/edit a product
2. Select a category that has subcategories
3. Subcategory pills appear → click to toggle selection
4. Save → product reloads with subcategories assigned
5. Reopen edit → subcategory pills are pre-selected
6. Changing category clears subcategory selection

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/ProductsManagement.tsx
git commit -m "feat: add subcategory multi-select to product form"
```

---

## Self-Review Checklist

- [x] DB migration: `parent_id` on categories + `product_subcategories` junction table
- [x] GET /categories: hierarchical response with `subcategories` array
- [x] POST/PUT /categories: accepts `parent_id`, validates it points to root category
- [x] DELETE /categories: blocked if has subcategories
- [x] GET /products: `subcategory` slug filter param wired
- [x] GET /products: `subcategories` array in each product response
- [x] GET /products/:id: `subcategories` array in response
- [x] PUT /products/:id: `subcategory_ids` atomically replaces junction rows
- [x] POST /products: `subcategory_ids` inserts junction rows
- [x] TypeScript types: `Category.subcategories`, `Category.parentId`, `Product.subcategories`
- [x] `ProductFilters.subcategory` wired through `getProducts`
- [x] Products.tsx: subcategory pills + active badge + reset + dependency array
- [x] ProductCard.tsx: max 2 pills + "+ N autres"
- [x] CategoriesManagement.tsx: grouped table + parent_id form + delete guard
- [x] ProductsManagement.tsx: multi-select + reset on category change + payload includes subcategory_ids
