import { useState, useEffect } from 'react';
import { linksApi } from '../api';

const STATUS_LABEL = {
  pending: 'Pendiente',
  draft: 'Draft',
  published: 'Publicado',
  failed: 'Fallido',
};

const STATUS_STYLE = {
  pending: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
  draft: 'bg-gray-800 text-gray-300 border-gray-700',
  published: 'bg-green-900/40 text-green-400 border-green-800',
  failed: 'bg-red-900/40 text-red-400 border-red-800',
};

export default function Links() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ url: '', product_name: '', product_description: '' });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await linksApi.getAll(filter !== 'all' ? filter : undefined);
      setLinks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [filter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setAdding(true);
    try {
      await linksApi.create(form);
      setForm({ url: '', product_name: '', product_description: '' });
      setShowForm(false);
      fetchLinks();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al anadir el link');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar este link?')) return;
    await linksApi.delete(id);
    fetchLinks();
  };

  const handleRetry = async (id) => {
    await linksApi.retry(id);
    fetchLinks();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Links de Afiliados</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors text-sm"
        >
          {showForm ? 'Cancelar' : '+ Anadir Link'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4"
        >
          <h2 className="font-semibold">Nuevo Link de Afiliado</h2>

          <div>
            <label className="block text-sm text-gray-400 mb-1">URL de Amazon Afiliado *</label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://amzn.to/... o https://www.amazon.es/..."
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Nombre del Producto <span className="text-gray-600">(opcional)</span>
            </label>
            <input
              type="text"
              value={form.product_name}
              onChange={(e) => setForm({ ...form, product_name: e.target.value })}
              placeholder="Ej: Auriculares Sony WH-1000XM5"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Descripcion para la IA <span className="text-gray-600">(opcional, mejora el resultado)</span>
            </label>
            <textarea
              value={form.product_description}
              onChange={(e) => setForm({ ...form, product_description: e.target.value })}
              placeholder="Precio, caracteristicas destacadas, publico objetivo, ventajas..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={adding}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 rounded-lg font-medium transition-colors"
          >
            {adding ? 'Anadiendo...' : 'Anadir Link'}
          </button>
        </form>
      )}

      <div className="flex gap-2">
        {['all', 'pending', 'draft', 'published', 'failed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            {f === 'all' ? 'Todos' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-400 text-center py-12">Cargando...</div>
      ) : links.length === 0 ? (
        <div className="text-gray-500 text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
          No hay links. Anade uno con el boton de arriba.
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <div
              key={link.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${STATUS_STYLE[link.status]}`}
                  >
                    {STATUS_LABEL[link.status]}
                  </span>
                  {link.product_name && (
                    <span className="font-medium text-white text-sm">{link.product_name}</span>
                  )}
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm truncate block"
                >
                  {link.url}
                </a>
                {link.product_description && (
                  <p className="text-gray-500 text-xs mt-1 line-clamp-1">{link.product_description}</p>
                )}
                <p className="text-gray-600 text-xs mt-1">
                  Anadido: {new Date(link.created_at).toLocaleString('es-ES')}
                  {link.published_at &&
                    ` | ${link.status === 'draft' ? 'Generado' : 'Publicado'}: ${new Date(link.published_at).toLocaleString('es-ES')}`}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                {link.status === 'failed' && (
                  <button
                    onClick={() => handleRetry(link.id)}
                    className="px-3 py-1.5 bg-yellow-900/40 text-yellow-400 hover:bg-yellow-900/60 border border-yellow-800 rounded-lg text-xs font-medium"
                  >
                    Reintentar
                  </button>
                )}
                {(link.status === 'pending' || link.status === 'failed') && (
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="px-3 py-1.5 bg-red-900/40 text-red-400 hover:bg-red-900/60 border border-red-800 rounded-lg text-xs font-medium"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
