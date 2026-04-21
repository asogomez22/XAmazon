import { useState, useEffect } from 'react';
import { botApi, tweetsApi } from '../api';

export default function Dashboard() {
  const [status, setStatus] = useState(null);
  const [recentTweets, setRecentTweets] = useState([]);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statusRes, tweetsRes] = await Promise.all([botApi.getStatus(), tweetsApi.getAll()]);
      setStatus(statusRes.data);
      setRecentTweets(tweetsRes.data.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTrigger = async () => {
    setTriggering(true);
    setTriggerResult(null);
    try {
      const res = await botApi.trigger();
      setTriggerResult({ ok: true, ...res.data });
      await fetchData();
    } catch (err) {
      setTriggerResult({ ok: false, message: err.response?.data?.error || err.message });
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return <div className="text-gray-400 text-center py-20">Cargando...</div>;
  }

  const stats = status?.stats || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
            status?.active
              ? 'bg-green-900/50 text-green-400'
              : 'bg-red-900/50 text-red-400'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${status?.active ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}
          />
          {status?.active ? 'Bot activo' : 'Bot inactivo'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Links', value: stats.total, color: 'text-blue-400' },
          { label: 'Pendientes', value: stats.pending, color: 'text-yellow-400' },
          { label: 'Publicados', value: stats.published, color: 'text-green-400' },
          { label: 'Fallidos', value: stats.failed, color: 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className={`text-3xl font-bold ${color}`}>{value ?? 0}</div>
            <div className="text-sm text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Control del Bot</h2>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            {status?.canPostNow ? (
              <p className="text-green-400 font-medium">Listo para publicar</p>
            ) : (
              <div>
                <p className="text-sm text-gray-400">Proxima publicacion en</p>
                <p className="text-white font-semibold text-lg">{status?.minutesRemaining} minutos</p>
                {status?.nextPostAt && (
                  <p className="text-gray-500 text-xs">
                    {new Date(status.nextPostAt).toLocaleString('es-ES')}
                  </p>
                )}
              </div>
            )}
            {status?.lastPostedAt && (
              <p className="text-gray-500 text-xs mt-1">
                Ultimo tweet: {new Date(status.lastPostedAt + 'Z').toLocaleString('es-ES')}
              </p>
            )}
          </div>
          <button
            onClick={handleTrigger}
            disabled={triggering}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:text-blue-400 rounded-lg font-medium transition-colors"
          >
            {triggering ? 'Procesando...' : 'Forzar publicacion'}
          </button>
        </div>

        {triggerResult && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              triggerResult.ok
                ? 'bg-green-900/30 border border-green-800 text-green-300'
                : 'bg-red-900/30 border border-red-800 text-red-300'
            }`}
          >
            <p className="font-medium">{triggerResult.message}</p>
            {triggerResult.tweets && (
              <div className="mt-2 space-y-2">
                {triggerResult.tweets.map((t, i) => (
                  <p key={i} className="text-sm text-gray-300 pl-3 border-l-2 border-green-700">
                    {i + 1}. {t}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Ultimos hilos publicados</h2>
        {recentTweets.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay hilos publicados aun</p>
        ) : (
          <div className="space-y-3">
            {recentTweets.map((thread) => (
              <div key={thread.id} className="border border-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-200 text-sm line-clamp-2">{thread.thread_content[0]}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {thread.thread_content.length} tweets &middot;{' '}
                      {new Date(thread.created_at).toLocaleString('es-ES')}
                    </p>
                  </div>
                  {thread.tweet_ids.length > 0 && (
                    <a
                      href={`https://twitter.com/i/web/status/${thread.tweet_ids[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 shrink-0"
                    >
                      Ver en X
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
