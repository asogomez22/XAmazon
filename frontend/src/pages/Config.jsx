import { useState, useEffect } from 'react';
import { botApi } from '../api';

const STYLES = [
  { value: 'engaging', label: 'Engaging', desc: 'Persuasivo y directo, genera urgencia de compra' },
  { value: 'informative', label: 'Informativo', desc: 'Tecnico y educativo, destaca specs y caracteristicas' },
  { value: 'casual', label: 'Casual', desc: 'Como si lo recomendara un amigo de confianza' },
  { value: 'viral', label: 'Viral', desc: 'Maximo impacto, frases impactantes y emojis' },
];

function Toggle({ value, onChange }) {
  const isOn = value === 'true';
  return (
    <button
      type="button"
      onClick={() => onChange(isOn ? 'false' : 'true')}
      className={`relative w-11 h-6 rounded-full transition-colors ${isOn ? 'bg-blue-600' : 'bg-gray-700'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          isOn ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function Config() {
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [twitterStatus, setTwitterStatus] = useState(null);

  useEffect(() => {
    botApi.getConfig().then((res) => setConfig(res.data)).catch(console.error);
  }, []);

  const set = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await botApi.updateConfig(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Error al guardar: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyTwitter = async () => {
    setVerifying(true);
    setTwitterStatus(null);
    try {
      const res = await botApi.verifyTwitter();
      setTwitterStatus({ ok: true, user: res.data.user });
    } catch (err) {
      setTwitterStatus({ ok: false, error: err.response?.data?.error || err.message });
    } finally {
      setVerifying(false);
    }
  };

  if (!config) return <div className="text-gray-400 text-center py-12">Cargando...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Configuracion del Bot</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-5 py-2 rounded-lg font-medium transition-colors text-sm ${
            saved
              ? 'bg-green-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white'
          }`}
        >
          {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-5">
        <h2 className="font-semibold">Estado</h2>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-sm">Bot activo</div>
            <div className="text-xs text-gray-400">El bot revisa y publica automaticamente cada 5 min</div>
          </div>
          <Toggle value={config.bot_active} onChange={(v) => set('bot_active', v)} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-sm">Auto-publicar en X</div>
            <div className="text-xs text-gray-400">Si esta off, genera el hilo pero no lo publica (draft)</div>
          </div>
          <Toggle value={config.auto_post} onChange={(v) => set('auto_post', v)} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
        <h2 className="font-semibold">Frecuencia de publicacion</h2>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Horas entre publicaciones</span>
            <span className="text-white font-semibold">{config.posting_interval_hours}h</span>
          </div>
          <input
            type="range"
            min="1"
            max="24"
            step="0.5"
            value={config.posting_interval_hours}
            onChange={(e) => set('posting_interval_hours', e.target.value)}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>1h (agresivo)</span>
            <span>12h</span>
            <span>24h (conservador)</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
        <h2 className="font-semibold">Contenido del hilo</h2>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Estilo</label>
          <div className="grid grid-cols-1 gap-2">
            {STYLES.map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => set('thread_style', value)}
                className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                  config.thread_style === value
                    ? 'border-blue-500 bg-blue-900/20 text-white'
                    : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                }`}
              >
                <span className="font-medium">{label}</span>
                <span className="text-xs ml-2 opacity-70">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Idioma</label>
          <div className="flex gap-2">
            {[
              { value: 'es', label: 'Espanol' },
              { value: 'en', label: 'Ingles' },
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => set('language', value)}
                className={`px-4 py-2 rounded-lg border transition-colors text-sm font-medium ${
                  config.language === value
                    ? 'border-blue-500 bg-blue-900/20 text-white'
                    : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Tweets por hilo</span>
            <span className="text-white font-semibold">{config.max_tweets_per_thread}</span>
          </div>
          <input
            type="range"
            min="3"
            max="10"
            step="1"
            value={config.max_tweets_per_thread}
            onChange={(e) => set('max_tweets_per_thread', e.target.value)}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>3 (corto)</span>
            <span>6-7</span>
            <span>10 (largo)</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
        <h2 className="font-semibold">Verificar conexion con X (Twitter)</h2>
        <p className="text-sm text-gray-400">
          Comprueba que las credenciales configuradas en{' '}
          <code className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300 text-xs">backend/.env</code>{' '}
          son correctas. Esta prueba valida la autenticacion, pero X puede seguir rechazando la publicacion si tu plan API no permite escribir tweets.
        </p>
        <button
          onClick={handleVerifyTwitter}
          disabled={verifying}
          className="px-4 py-2 bg-sky-700 hover:bg-sky-600 disabled:bg-sky-900 rounded-lg font-medium transition-colors text-sm"
        >
          {verifying ? 'Verificando...' : 'Verificar credenciales de X'}
        </button>
        {twitterStatus && (
          <div
            className={`p-4 rounded-lg text-sm ${
              twitterStatus.ok
                ? 'bg-green-900/30 border border-green-800 text-green-300'
                : 'bg-red-900/30 border border-red-800 text-red-300'
            }`}
          >
            {twitterStatus.ok
              ? `Conectado como @${twitterStatus.user.username}`
              : `Error: ${twitterStatus.error}`}
          </div>
        )}
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="font-semibold mb-3">Variables de entorno necesarias</h2>
        <p className="text-sm text-gray-400 mb-3">
          Crea el archivo{' '}
          <code className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300 text-xs">backend/.env</code>{' '}
          con estas variables:
        </p>
        <pre className="bg-gray-800 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
{`TWITTER_API_KEY=tu_api_key
TWITTER_API_SECRET=tu_api_secret
TWITTER_ACCESS_TOKEN=tu_access_token
TWITTER_ACCESS_SECRET=tu_access_secret
OPENAI_API_KEY=tu_openai_key
OPENAI_MODEL=gpt-4o`}
        </pre>
      </div>
    </div>
  );
}
