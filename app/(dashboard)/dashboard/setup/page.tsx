"use client";

import { useState, useEffect, useCallback } from "react";

type Tab = "genres" | "singers" | "holidays" | "tags";

interface Genre {
  id: string;
  name: string;
}

interface Singer {
  id: string;
  name: string;
}

interface Holiday {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
  tagCategoryId: string;
}

interface TagCategory {
  id: string;
  name: string;
  tags: Tag[];
}

function CrudList<T extends { id: string; name: string }>({
  title,
  items,
  fetchItems,
  createItem,
  updateItem,
  deleteItem,
  deleteError,
}: {
  title: string;
  items: T[];
  fetchItems: () => Promise<T[]>;
  createItem: (name: string) => Promise<T>;
  updateItem: (id: string, name: string) => Promise<T>;
  deleteItem: (id: string) => Promise<void>;
  deleteError?: (err: { error?: string }) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newValue, setNewValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newValue.trim()) return;
    setError("");
    setLoading(true);
    try {
      await createItem(newValue.trim());
      setNewValue("");
      await fetchItems();
    } catch (err: unknown) {
      setError((err as { error?: string })?.error || "Failed to create");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editValue.trim()) return;
    setError("");
    setLoading(true);
    try {
      await updateItem(editingId, editValue.trim());
      setEditingId(null);
      setEditValue("");
      await fetchItems();
    } catch (err: unknown) {
      setError((err as { error?: string })?.error || "Failed to update");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this item?")) return;
    setError("");
    setLoading(true);
    try {
      await deleteItem(id);
      await fetchItems();
    } catch (err: unknown) {
      const msg = (err as { error?: string })?.error || "Failed to delete";
      setError(msg);
      if (deleteError) deleteError(err as { error?: string });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <h3 className="mb-3 font-semibold text-slate-800">{title}</h3>
      <form onSubmit={handleCreate} className="mb-3 flex gap-2">
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Add new..."
          className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !newValue.trim()}
          className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </form>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <ul className="space-y-1">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between rounded bg-slate-50 px-2 py-1"
          >
            {editingId === item.id ? (
              <form onSubmit={handleUpdate} className="flex flex-1 gap-2">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 rounded border border-slate-300 px-2 py-0.5 text-sm"
                  autoFocus
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setEditValue("");
                  }}
                  className="text-sm text-slate-500 hover:underline"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <span className="text-sm text-slate-800">{item.name}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(item.id);
                      setEditValue(item.name);
                    }}
                    className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="text-sm text-red-600 hover:underline disabled:opacity-50"
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SetupPage() {
  const [tab, setTab] = useState<Tab>("genres");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [singers, setSingers] = useState<Singer[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([]);

  const fetchGenres = useCallback(async () => {
    const res = await fetch("/api/genres");
    const data = await res.json();
    setGenres(data);
    return data;
  }, []);
  const fetchSingers = useCallback(async () => {
    const res = await fetch("/api/singers");
    const data = await res.json();
    setSingers(data);
    return data;
  }, []);
  const fetchHolidays = useCallback(async () => {
    const res = await fetch("/api/holidays");
    const data = await res.json();
    setHolidays(data);
    return data;
  }, []);
  const fetchTagCategories = useCallback(async () => {
    const res = await fetch("/api/tag-categories");
    const data = await res.json();
    setTagCategories(data);
    return data;
  }, []);

  useEffect(() => {
    fetchGenres();
    fetchSingers();
    fetchHolidays();
    fetchTagCategories();
  }, [fetchGenres, fetchSingers, fetchHolidays, fetchTagCategories]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "genres", label: "Genres" },
    { id: "singers", label: "Singers" },
    { id: "holidays", label: "Holidays" },
    { id: "tags", label: "Tag Categories & Tags" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">Setup</h1>
      <div className="mb-4 flex gap-2 border-b border-slate-200">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              tab === id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "genres" && (
        <CrudList
          title="Genres"
          items={genres}
          fetchItems={fetchGenres}
          createItem={async (name) => {
            const res = await fetch("/api/genres", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name }),
            });
            const data = await res.json();
            if (!res.ok) throw data;
            return data;
          }}
          updateItem={async (id, name) => {
            const res = await fetch(`/api/genres/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name }),
            });
            const data = await res.json();
            if (!res.ok) throw data;
            return data;
          }}
          deleteItem={async (id) => {
            const res = await fetch(`/api/genres/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw data;
          }}
        />
      )}

      {tab === "singers" && (
        <CrudList
          title="Singers"
          items={singers}
          fetchItems={fetchSingers}
          createItem={async (name) => {
            const res = await fetch("/api/singers", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name }),
            });
            const data = await res.json();
            if (!res.ok) throw data;
            return data;
          }}
          updateItem={async (id, name) => {
            const res = await fetch(`/api/singers/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name }),
            });
            const data = await res.json();
            if (!res.ok) throw data;
            return data;
          }}
          deleteItem={async (id) => {
            const res = await fetch(`/api/singers/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw data;
          }}
        />
      )}

      {tab === "holidays" && (
        <CrudList
          title="Holidays"
          items={holidays}
          fetchItems={fetchHolidays}
          createItem={async (name) => {
            const res = await fetch("/api/holidays", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name }),
            });
            const data = await res.json();
            if (!res.ok) throw data;
            return data;
          }}
          updateItem={async (id, name) => {
            const res = await fetch(`/api/holidays/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name }),
            });
            const data = await res.json();
            if (!res.ok) throw data;
            return data;
          }}
          deleteItem={async (id) => {
            const res = await fetch(`/api/holidays/${id}`, {
              method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) throw data;
          }}
        />
      )}

      {tab === "tags" && (
        <TagsTab
          categories={tagCategories}
          fetchCategories={fetchTagCategories}
        />
      )}
    </div>
  );
}

function TagsTab({
  categories,
  fetchCategories,
}: {
  categories: TagCategory[];
  fetchCategories: () => Promise<TagCategory[]>;
}) {
  const [newCategory, setNewCategory] = useState("");
  const [newTagByCat, setNewTagByCat] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryValue, setEditCategoryValue] = useState("");
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTagValue, setEditTagValue] = useState("");

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/tag-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      setNewCategory("");
      await fetchCategories();
    } catch (err: unknown) {
      setError((err as { error?: string })?.error || "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTag(catId: string) {
    const name = newTagByCat[catId]?.trim();
    if (!name) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, tagCategoryId: catId }),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      setNewTagByCat((p) => ({ ...p, [catId]: "" }));
      await fetchCategories();
    } catch (err: unknown) {
      setError((err as { error?: string })?.error || "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteTag(id: string) {
    if (!confirm("Delete this tag?")) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/tags/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw data;
      await fetchCategories();
    } catch (err: unknown) {
      setError((err as { error?: string })?.error || "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCategoryId || !editCategoryValue.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/tag-categories/${editingCategoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editCategoryValue.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      setEditingCategoryId(null);
      setEditCategoryValue("");
      await fetchCategories();
    } catch (err: unknown) {
      setError((err as { error?: string })?.error || "Failed to update");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateTag(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTagId || !editTagValue.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/tags/${editingTagId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editTagValue.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      setEditingTagId(null);
      setEditTagValue("");
      await fetchCategories();
    } catch (err: unknown) {
      setError((err as { error?: string })?.error || "Failed to update");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded border border-slate-200 bg-white p-4">
        <h3 className="mb-3 font-semibold text-slate-800">Tag Categories</h3>
        <form onSubmit={handleAddCategory} className="mb-3 flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category (e.g. Original Artist)"
            className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !newCategory.trim()}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Add Category
          </button>
        </form>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {categories.map((cat) => (
        <div
          key={cat.id}
          className="rounded border border-slate-200 bg-white p-4"
        >
          {editingCategoryId === cat.id ? (
            <form
              onSubmit={handleUpdateCategory}
              className="mb-3 flex items-center gap-2"
            >
              <input
                type="text"
                value={editCategoryValue}
                onChange={(e) => setEditCategoryValue(e.target.value)}
                className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
                autoFocus
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="text-sm text-blue-600 hover:underline"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingCategoryId(null);
                  setEditCategoryValue("");
                }}
                className="text-sm text-slate-500 hover:underline"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">{cat.name}</h3>
              <button
                type="button"
                onClick={() => {
                  setEditingCategoryId(cat.id);
                  setEditCategoryValue(cat.name);
                }}
                className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                disabled={loading}
              >
                Edit
              </button>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddTag(cat.id);
            }}
            className="mb-3 flex gap-2"
          >
            <input
              type="text"
              value={newTagByCat[cat.id] || ""}
              onChange={(e) =>
                setNewTagByCat((p) => ({ ...p, [cat.id]: e.target.value }))
              }
              placeholder="Add tag..."
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !(newTagByCat[cat.id] || "").trim()}
              className="rounded bg-slate-600 px-3 py-1 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
            >
              Add Tag
            </button>
          </form>
          <ul className="space-y-1">
            {cat.tags.map((tag) => (
              <li
                key={tag.id}
                className="flex items-center justify-between rounded bg-slate-50 px-2 py-1"
              >
                {editingTagId === tag.id ? (
                  <form
                    onSubmit={handleUpdateTag}
                    className="flex flex-1 gap-2"
                  >
                    <input
                      type="text"
                      value={editTagValue}
                      onChange={(e) => setEditTagValue(e.target.value)}
                      className="flex-1 rounded border border-slate-300 px-2 py-0.5 text-sm"
                      autoFocus
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTagId(null);
                        setEditTagValue("");
                      }}
                      className="text-sm text-slate-500 hover:underline"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <span className="text-sm text-slate-800">
                      {cat.name}: {tag.name}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTagId(tag.id);
                          setEditTagValue(tag.name);
                        }}
                        className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTag(tag.id)}
                        className="text-sm text-red-600 hover:underline disabled:opacity-50"
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
