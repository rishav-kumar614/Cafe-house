import { lazy, Suspense, useMemo, useState } from 'react';
import { Modal } from '../../components/Modal.jsx';
import { api, issuesToFieldErrors } from '../../lib/api.js';
import { useUI } from '../../store/ui.js';
import { FOOD_MODELS } from '../../three/food/library.js';

const FoodViewer = lazy(() => import('../../three/food/FoodViewer.jsx'));

const toRupees = (paise) => (paise / 100).toString();
const toPaise = (rupees) => Math.round(Number(rupees || 0) * 100);
const list = (s) =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

function fromProduct(p) {
  return {
    name: p?.name || '',
    slug: p?.slug || '',
    description: p?.description || '',
    categories: (p?.categories || []).map((c) => (typeof c === 'string' ? c : c._id)),
    basePrice: p ? toRupees(p.basePrice) : '',
    isVeg: p?.isVeg ?? true,
    tags: (p?.tags || []).join(', '),
    ingredients: (p?.ingredients || []).join(', '),
    sizes: (p?.sizes || []).map((s) => ({ ...s, priceDelta: toRupees(s.priceDelta) })),
    options: (p?.options || []).map((g) => ({ ...g, choices: g.choices.map((c) => ({ ...c, priceDelta: toRupees(c.priceDelta) })) })),
    image: p?.image || '',
    modelKind: p?.model?.kind || 'procedural',
    modelKey: p?.model?.key || '',
    modelParams: JSON.stringify(p?.model?.params || {}, null, 0),
    modelUrl: p?.model?.url || '',
    modelScale: String(p?.model?.scale ?? 1),
    isAvailable: p?.isAvailable ?? true,
    isFeatured: p?.isFeatured ?? false,
    isSignature: p?.isSignature ?? false,
    sortOrder: String(p?.sortOrder ?? 0),
    related: (p?.related || []).map(String),
  };
}

function Upload({ kind, onUploaded, onError }) {
  const [busy, setBusy] = useState(false);
  const accept = kind === 'image' ? 'image/jpeg,image/png,image/webp' : '.glb,model/gltf-binary';
  const onChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const body = new FormData();
    body.append('file', file);
    setBusy(true);
    try {
      const res = await api(`/admin/uploads/${kind}`, { method: 'POST', body });
      onUploaded(res.url);
    } catch (err) {
      onError(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <label className="btn btn-sm btn-ghost upload-btn">
      {busy ? 'Uploading…' : kind === 'image' ? 'Upload image' : 'Upload .glb'}
      <input type="file" accept={accept} onChange={onChange} disabled={busy} className="visually-hidden" />
    </label>
  );
}

export function ProductEditor({ product, categories, allProducts, onClose, onSaved, onAuthError }) {
  const [f, setF] = useState(() => fromProduct(product));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useUI((s) => s.toast);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const parsedParams = useMemo(() => {
    try {
      const v = JSON.parse(f.modelParams || '{}');
      return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
    } catch {
      return null;
    }
  }, [f.modelParams]);

  const previewProduct = useMemo(
    () => ({
      slug: `preview-${f.modelKind}-${f.modelKey}-${f.modelUrl}-${f.modelParams}`,
      name: f.name || 'Preview',
      categories: categories.filter((c) => f.categories.includes(c._id)).map((c) => ({ slug: c.slug })),
      model: { kind: f.modelKind, key: f.modelKey, params: parsedParams || {}, url: f.modelUrl, scale: Number(f.modelScale) || 1 },
    }),
    [f.modelKind, f.modelKey, f.modelUrl, f.modelParams, f.modelScale, f.name, f.categories, categories, parsedParams]
  );

  const uploadError = (err) => {
    onAuthError(err);
    toast(err.message, 'error');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!parsedParams) {
      setErrors({ 'model.params': 'Model parameters must be a JSON object' });
      return;
    }
    const body = {
      name: f.name,
      ...(f.slug ? { slug: f.slug } : {}),
      description: f.description,
      categories: f.categories,
      basePrice: toPaise(f.basePrice),
      isVeg: f.isVeg,
      tags: list(f.tags),
      ingredients: list(f.ingredients),
      sizes: f.sizes.map((s) => ({ key: s.key, label: s.label, priceDelta: toPaise(s.priceDelta) })),
      options: f.options.map((g) => ({ ...g, maxChoices: Number(g.maxChoices) || 0, choices: g.choices.map((c) => ({ key: c.key, label: c.label, priceDelta: toPaise(c.priceDelta) })) })),
      image: f.image,
      model: { kind: f.modelKind, key: f.modelKey, params: parsedParams, url: f.modelUrl, scale: Number(f.modelScale) || 1 },
      isAvailable: f.isAvailable,
      isFeatured: f.isFeatured,
      isSignature: f.isSignature,
      sortOrder: Number(f.sortOrder) || 0,
      related: f.related,
    };
    setBusy(true);
    try {
      await api(product ? `/admin/products/${product._id}` : '/admin/products', { method: product ? 'PUT' : 'POST', body });
      toast(`${f.name} saved`, 'success');
      onSaved();
    } catch (err) {
      onAuthError(err);
      setErrors(issuesToFieldErrors(err.issues));
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const err = (k) => errors[k] && <p className="error-text small">{errors[k]}</p>;
  const modelDef = FOOD_MODELS[f.modelKey];

  return (
    <Modal open onClose={onClose} title={product ? `Edit ${product.name}` : 'Add a dish'} className="editor-modal">
      <form className="editor" onSubmit={submit} noValidate>
        <div className="editor-grid">
          <div>
            <div className={`field ${errors.name ? 'invalid' : ''}`}>
              <label htmlFor="pe-name">Name</label>
              <input id="pe-name" value={f.name} onChange={(e) => set('name', e.target.value)} required data-autofocus />
              {err('name')}
            </div>
            <div className={`field ${errors.slug ? 'invalid' : ''}`}>
              <label htmlFor="pe-slug">URL slug (optional)</label>
              <input id="pe-slug" value={f.slug} onChange={(e) => set('slug', e.target.value)} placeholder="generated from the name" />
              {err('slug')}
            </div>
            <div className="field">
              <label htmlFor="pe-desc">Description</label>
              <textarea id="pe-desc" rows={3} value={f.description} onChange={(e) => set('description', e.target.value)} />
            </div>
            <div className="row gap">
              <div className={`field grow ${errors.basePrice ? 'invalid' : ''}`}>
                <label htmlFor="pe-price">Base price (₹)</label>
                <input id="pe-price" type="number" min="0" step="1" value={f.basePrice} onChange={(e) => set('basePrice', e.target.value)} required />
                {err('basePrice')}
              </div>
              <fieldset className="field grow">
                <legend>Diet</legend>
                <label className="inline">
                  <input type="radio" checked={f.isVeg} onChange={() => set('isVeg', true)} /> Veg
                </label>
                <label className="inline">
                  <input type="radio" checked={!f.isVeg} onChange={() => set('isVeg', false)} /> Non-veg
                </label>
              </fieldset>
            </div>
            <fieldset className={`field ${errors.categories ? 'invalid' : ''}`}>
              <legend>Categories</legend>
              <div className="check-grid">
                {categories.map((c) => (
                  <label key={c._id} className="inline">
                    <input type="checkbox" checked={f.categories.includes(c._id)} onChange={(e) => set('categories', e.target.checked ? [...f.categories, c._id] : f.categories.filter((x) => x !== c._id))} /> {c.name}
                  </label>
                ))}
              </div>
              {err('categories')}
            </fieldset>
            <div className="field">
              <label htmlFor="pe-ing">Ingredients (comma separated)</label>
              <input id="pe-ing" value={f.ingredients} onChange={(e) => set('ingredients', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="pe-tags">Tags (comma separated, e.g. spicy)</label>
              <input id="pe-tags" value={f.tags} onChange={(e) => set('tags', e.target.value)} />
            </div>
            <div className="row gap wrap">
              {[
                ['isAvailable', 'Available'],
                ['isFeatured', 'Featured'],
                ['isSignature', 'Signature'],
              ].map(([k, label]) => (
                <label key={k} className="inline">
                  <input type="checkbox" checked={f[k]} onChange={(e) => set(k, e.target.checked)} /> {label}
                </label>
              ))}
              <label className="inline">
                Sort order <input type="number" className="tiny" value={f.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} />
              </label>
            </div>
          </div>

          <div>
            <fieldset className="field">
              <legend>3D model</legend>
              <div className="segmented small">
                {['procedural', 'glb'].map((k) => (
                  <button key={k} type="button" className={f.modelKind === k ? 'active' : ''} aria-pressed={f.modelKind === k} onClick={() => set('modelKind', k)}>
                    {k === 'procedural' ? 'Built-in model' : 'GLB file'}
                  </button>
                ))}
              </div>
              {f.modelKind === 'procedural' ? (
                <>
                  <label htmlFor="pe-model">Model</label>
                  <select id="pe-model" value={f.modelKey} onChange={(e) => set('modelKey', e.target.value)}>
                    <option value="">Category default</option>
                    {Object.entries(FOOD_MODELS).map(([k, m]) => (
                      <option key={k} value={k}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="pe-params">Parameters (JSON)</label>
                  <textarea id="pe-params" rows={2} className={parsedParams ? '' : 'invalid-input'} value={f.modelParams} onChange={(e) => set('modelParams', e.target.value)} spellCheck={false} />
                  {modelDef?.params && <p className="hint">Options: {Object.entries(modelDef.params).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' | ') : v}`).join('; ')}</p>}
                  {err('model.params')}
                </>
              ) : (
                <>
                  <label htmlFor="pe-url">Model URL</label>
                  <div className="row gap-sm">
                    <input id="pe-url" value={f.modelUrl} onChange={(e) => set('modelUrl', e.target.value)} placeholder="/uploads/models/… or https://…" className="grow" />
                    <Upload kind="model" onUploaded={(url) => set('modelUrl', url)} onError={uploadError} />
                  </div>
                  <label htmlFor="pe-scale">Scale</label>
                  <input id="pe-scale" type="number" step="0.1" min="0.1" value={f.modelScale} onChange={(e) => set('modelScale', e.target.value)} />
                  <p className="hint">Only use models you have the rights to use commercially. If the file fails to load, the built-in model for the category is shown.</p>
                  {err('model.url')}
                </>
              )}
            </fieldset>
            <div className="editor-preview">
              <Suspense fallback={<p className="muted">Loading preview…</p>}>
                <FoodViewer product={previewProduct} compact />
              </Suspense>
            </div>
            <div className="field">
              <label htmlFor="pe-image">Photo (optional)</label>
              <div className="row gap-sm">
                <input id="pe-image" value={f.image} onChange={(e) => set('image', e.target.value)} className="grow" placeholder="/uploads/images/…" />
                <Upload kind="image" onUploaded={(url) => set('image', url)} onError={uploadError} />
                {f.image && (
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => set('image', '')}>
                    Remove
                  </button>
                )}
              </div>
              {f.image && <img src={f.image} alt="" className="image-preview" />}
              {err('image')}
            </div>
          </div>
        </div>

        <fieldset className="field">
          <legend>Sizes (first is the default; price is added to the base price)</legend>
          {f.sizes.map((s, i) => (
            <div key={i} className="row gap-sm repeat-row">
              <input aria-label="Size key" placeholder="key" value={s.key} onChange={(e) => set('sizes', f.sizes.map((x, k) => (k === i ? { ...x, key: e.target.value } : x)))} />
              <input aria-label="Size label" placeholder="Label" value={s.label} onChange={(e) => set('sizes', f.sizes.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} />
              <input aria-label="Extra price (₹)" type="number" min="0" placeholder="+₹" value={s.priceDelta} onChange={(e) => set('sizes', f.sizes.map((x, k) => (k === i ? { ...x, priceDelta: e.target.value } : x)))} />
              <button type="button" className="icon-btn" aria-label="Remove size" onClick={() => set('sizes', f.sizes.filter((_, k) => k !== i))}>
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => set('sizes', [...f.sizes, { key: '', label: '', priceDelta: '0' }])}>
            + Add size
          </button>
          {err('sizes')}
        </fieldset>

        <fieldset className="field">
          <legend>Customisation groups</legend>
          {f.options.map((g, gi) => {
            const upd = (patch) => set('options', f.options.map((x, k) => (k === gi ? { ...x, ...patch } : x)));
            return (
              <div key={gi} className="option-editor">
                <div className="row gap-sm wrap">
                  <input aria-label="Group key" placeholder="key" value={g.key} onChange={(e) => upd({ key: e.target.value })} />
                  <input aria-label="Group label" placeholder="Label" value={g.label} onChange={(e) => upd({ label: e.target.value })} />
                  <select aria-label="Selection type" value={g.type} onChange={(e) => upd({ type: e.target.value })}>
                    <option value="single">Choose one</option>
                    <option value="multi">Choose several</option>
                  </select>
                  <label className="inline">
                    <input type="checkbox" checked={g.required} onChange={(e) => upd({ required: e.target.checked })} /> Required
                  </label>
                  {g.type === 'multi' && (
                    <label className="inline">
                      Max <input type="number" className="tiny" min="0" value={g.maxChoices} onChange={(e) => upd({ maxChoices: e.target.value })} />
                    </label>
                  )}
                  <button type="button" className="icon-btn" aria-label="Remove group" onClick={() => set('options', f.options.filter((_, k) => k !== gi))}>
                    ✕
                  </button>
                </div>
                {g.choices.map((c, ci) => (
                  <div key={ci} className="row gap-sm repeat-row indent">
                    <input aria-label="Choice key" placeholder="key" value={c.key} onChange={(e) => upd({ choices: g.choices.map((x, k) => (k === ci ? { ...x, key: e.target.value } : x)) })} />
                    <input aria-label="Choice label" placeholder="Label" value={c.label} onChange={(e) => upd({ choices: g.choices.map((x, k) => (k === ci ? { ...x, label: e.target.value } : x)) })} />
                    <input aria-label="Extra price (₹)" type="number" min="0" placeholder="+₹" value={c.priceDelta} onChange={(e) => upd({ choices: g.choices.map((x, k) => (k === ci ? { ...x, priceDelta: e.target.value } : x)) })} />
                    <button type="button" className="icon-btn" aria-label="Remove choice" onClick={() => upd({ choices: g.choices.filter((_, k) => k !== ci) })}>
                      ✕
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-ghost indent" onClick={() => upd({ choices: [...g.choices, { key: '', label: '', priceDelta: '0' }] })}>
                  + Add choice
                </button>
              </div>
            );
          })}
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => set('options', [...f.options, { key: '', label: '', type: 'single', required: false, maxChoices: 0, choices: [{ key: '', label: '', priceDelta: '0' }] }])}>
            + Add customisation group
          </button>
          {err('options')}
        </fieldset>

        <fieldset className="field">
          <legend>Related dishes</legend>
          <select multiple size={5} value={f.related} onChange={(e) => set('related', [...e.target.selectedOptions].map((o) => o.value).slice(0, 8))} aria-label="Related dishes (hold Ctrl or Cmd to select several)">
            {allProducts
              .filter((p) => p._id !== product?._id)
              .map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
          </select>
          <p className="hint">Hold Ctrl (or Cmd) to pick up to 8.</p>
        </fieldset>

        {error && (
          <p className="error-banner" role="alert">
            {error}
            {Object.keys(errors).length > 0 && ` (${Object.entries(errors).map(([k, v]) => `${k}: ${v}`).join('; ')})`}
          </p>
        )}
        <div className="row gap end sticky-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn" disabled={busy}>
            {busy ? 'Saving…' : 'Save dish'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
