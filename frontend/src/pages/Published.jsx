import { useEffect, useState } from 'react';
import { tweetsApi } from '../api';

export default function Published() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [publishingId, setPublishingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchThreads = async () => {
    const res = await tweetsApi.getAll();
    setThreads(res.data);
  };

  useEffect(() => {
    fetchThreads()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const handlePublishDraft = async (id) => {
    setPublishingId(id);
    setFeedback(null);

    try {
      const res = await tweetsApi.publishDraft(id);
      setThreads((prev) =>
        prev.map((thread) => (thread.id === id ? res.data : thread)).sort((a, b) => {
          return new Date(b.created_at) - new Date(a.created_at);
        })
      );
      setFeedback({
        ok: true,
        message: `Hilo publicado en X con ${res.data.tweet_ids.length} tweets`,
      });
    } catch (err) {
      setFeedback({
        ok: false,
        message: err.response?.data?.error || err.message,
      });
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hilos Generados</h1>
        <span className="text-sm text-gray-400">{threads.length} hilos</span>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            feedback.ok
              ? 'border-green-800 bg-green-900/30 text-green-300'
              : 'border-red-800 bg-red-900/30 text-red-300'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 text-center py-12">Cargando...</div>
      ) : threads.length === 0 ? (
        <div className="text-gray-500 text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
          No hay hilos generados aun. El bot creara uno cuando haya links pendientes.
        </div>
      ) : (
        <div className="space-y-4">
          {threads.map((thread) => {
            const isDraft = thread.tweet_ids.length === 0;
            const isPublishing = publishingId === thread.id;

            return (
              <div key={thread.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <button
                  className="w-full text-left p-4 hover:bg-gray-800/50 transition-colors"
                  onClick={() => toggle(thread.id)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="bg-blue-900/40 text-blue-400 border border-blue-800 px-2 py-0.5 rounded text-xs">
                          {thread.thread_content.length} tweets
                        </span>
                        {isDraft && (
                          <span className="text-xs text-gray-500 border border-gray-700 px-2 py-0.5 rounded">
                            Draft
                          </span>
                        )}
                        {!isDraft && (
                          <a
                            href={`https://twitter.com/i/web/status/${thread.tweet_ids[0]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            Ver en X
                          </a>
                        )}
                        {isDraft && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePublishDraft(thread.id);
                            }}
                            disabled={isPublishing}
                            className="text-xs px-2.5 py-1 rounded border border-sky-700 bg-sky-900/40 text-sky-300 hover:bg-sky-900/60 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {isPublishing ? 'Publicando...' : 'Publicar en X'}
                          </button>
                        )}
                      </div>
                      <p className="text-gray-200 text-sm font-medium line-clamp-1">
                        {thread.thread_content[0]}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {new Date(thread.created_at).toLocaleString('es-ES')}
                        {thread.product_name && ` | ${thread.product_name}`}
                      </p>
                    </div>
                    <span className="text-gray-600 text-sm">{expanded[thread.id] ? '[-]' : '[+]'}</span>
                  </div>
                </button>

                {expanded[thread.id] && (
                  <div className="border-t border-gray-800 p-4">
                    <div className="space-y-4">
                      {thread.thread_content.map((tweet, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="flex flex-col items-center shrink-0">
                            <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-xs font-bold">
                              {i + 1}
                            </div>
                            {i < thread.thread_content.length - 1 && (
                              <div className="w-px flex-1 bg-gray-700 mt-1 min-h-4" />
                            )}
                          </div>
                          <div className="flex-1 pb-2">
                            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                              {tweet}
                            </p>
                            <p className="text-gray-600 text-xs mt-1">
                              {tweet.length}/280 caracteres
                              {thread.tweet_ids[i] && (
                                <a
                                  href={`https://twitter.com/i/web/status/${thread.tweet_ids[i]}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 ml-2"
                                >
                                  Ver tweet
                                </a>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between gap-3 flex-wrap">
                      <p className="text-xs text-gray-500">
                        Link:{' '}
                        <a
                          href={thread.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          {thread.link_url}
                        </a>
                      </p>
                      {isDraft && (
                        <button
                          type="button"
                          onClick={() => handlePublishDraft(thread.id)}
                          disabled={isPublishing}
                          className="text-xs px-3 py-1.5 rounded-lg border border-sky-700 bg-sky-900/40 text-sky-300 hover:bg-sky-900/60 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isPublishing ? 'Publicando...' : 'Publicar este draft'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
