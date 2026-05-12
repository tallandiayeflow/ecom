# Subcategories Feature Design

**Date:** 2026-05-12  
**Status:** Approved

## Summary

Add subcategories to the e-commerce platform using a self-referencing `categories` table. Products can belong to multiple subcategories. Subcategories appear in product filters, product cards, and admin management.

## Constraints

- 1 level deep only (category → subcategory, no deeper nesting)
- Product can have multiple subcategories (many-to-many)
- Subcategories visible in: filters, product cards, navigation, admin

## Approach

Self-referencing `categories` table (`parent_id` column). Reuses existing slug generation, icon system, and admin UI. Junction table `product_subcategories` handles many-to-many.

---

## Section 1: Database

### Migration on `categories`

```sql
ALTER TABLE categories ADD COLUMN parent_id VARCHAR(36) NULL;
ALTER TABLE categories ADD FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE;
ALTER TABLE categories ADD INDEX idx_parent (parent_id);
```

- `parent_id IS NULL` → root category
- `parent_id = <id>` → subcategory of that category
- CASCADE delete: deleting a parent removes its subcategories and their product links

### New junction table

```sql
CREATE TABLE product_subcategories (
    product_id VARCHAR(36) NOT NULL,
    subcategory_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (product_id, subcategory_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (subcategory_id) REFERENCES categories(id) ON DELETE CASCADE
);
```

**Rules:**
- `subcategory_id` must reference a `categories` row where `parent_id IS NOT NULL`
- `products.category_id` (main category FK) remains unchanged
- No constraint enforces subcategory belongs to same parent as `category_id` — flexibility intentional

---

## Section 2: Backend API

### `GET /categories`

Returns hierarchical structure. Root categories include nested `subcategories` array.

```json
[
  {
    "id": "uuid",
    "name": "Téléphones",
    "slug": "telephones",
    "icon": "Smartphone",
    "productCount": 45,
    "subcategories": [
      { "id": "uuid", "name": "Samsung", "slug": "samsung", "icon": "...", "productCount": 12 },
      { "id": "uuid", "name": "iPhone", "slug": "iphone", "icon": "...", "productCount": 8 }
    ]
  }
]
```

Implementation: fetch all categories, group in Python by `parent_id`.

### `GET /products`

New optional param `subcategory` (slug):

```
GET /products?subcategory=samsung
GET /products?category=telephones&subcategory=samsung
```

SQL: join `product_subcategories ps` + `categories sc ON ps.subcategory_id = sc.id AND sc.slug = ?`

### `POST /categories` and `PUT /categories/<id>`

Accept optional `parent_id`. Slug generation unchanged.

### `GET /products/<id>`

Returns `subcategories: [{id, name, slug}]` via join on `product_subcategories`.

### `PUT /products/<id>` (admin)

Accepts `subcategory_ids: list[str]`. Replaces all rows in `product_subcategories` for that product atomically (DELETE + INSERT in same transaction).

---

## Section 3: Frontend

### TypeScript types (`src/types/index.ts`)

```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  productCount: number;
  subcategories?: Category[];
}

interface Product {
  // ...existing fields...
  subcategories?: { id: string; name: string; slug: string }[];
}
```

### `Products.tsx` — filter panel

- Selecting a category reveals its subcategories as clickable pills below the category select
- Selecting a subcategory adds `subcategory` param to API call
- Active subcategory filter shown as removable badge (same pattern as existing filters)
- Clearing category resets subcategory selection

### `CategorySlider.tsx`

- Click behavior unchanged: navigate to `/products?category={slug}`
- No structural change required; subcategory navigation is handled via filter panel

### `ProductCard.tsx`

- Display subcategory pills below existing category badge
- Show max 2, then "+ N autres" if more
- Pills are non-interactive on card (no click navigation)

### `CategoriesManagement.tsx` (admin)

- Table grouped: root categories with subcategories indented below
- Create/edit form: optional "Catégorie parente" dropdown (shows only root categories)
- Delete blocked if category has products OR has subcategories (separate error messages)

### `ProductsManagement.tsx` (admin) — product form

- Multi-select for subcategories, filtered to subcategories of the selected `category_id`
- When `category_id` changes → reset subcategory selection
- Uses existing shadcn/ui Select or a multi-select component

---

## File Change Summary

| File | Change |
|------|--------|
| `backend/init_db.py` | Add `parent_id` to categories, create `product_subcategories` table |
| `backend/routes/categories.py` | Hierarchical GET, accept `parent_id` in POST/PUT, block delete if has subcategories |
| `backend/routes/products.py` | Add `subcategory` filter param, return subcategories in product response |
| `src/types/index.ts` | Add `subcategories` to Category and Product interfaces |
| `src/lib/api.ts` | Add `subcategory` to `ProductFilters`, update Category type usage |
| `src/pages/Products.tsx` | Subcategory pills in filter panel, active filter badge |
| `src/components/ProductCard.tsx` | Subcategory pills display |
| `src/pages/admin/CategoriesManagement.tsx` | Grouped table, parent_id in form, delete guard |
| `src/pages/admin/ProductsManagement.tsx` | Subcategory multi-select in product form |

## Out of Scope

- More than 1 nesting level
- Subcategory icons displayed in navigation slider
- Subcategory-specific landing pages
