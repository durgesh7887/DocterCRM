import { useState } from "react";
import { usePwaInstall } from "./usePwaInstall";

export function InstallPrompt() {
  const { isInstallable, isInstalled, isIos, triggerInstall } = usePwaInstall();
  const [showIosModal, setShowIosModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {isInstallable && (
        <button
          onClick={() => triggerInstall()}
          className="flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm active:scale-95 transition-all"
          title="Install MedFlow Doctor App"
        >
          <span className="text-sm">⬇️</span>
          <span>Install App</span>
        </button>
      )}

      {!isInstallable && isIos && (
        <button
          onClick={() => setShowIosModal(true)}
          className="flex items-center gap-1.5 rounded-xl border border-teal-600 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 active:scale-95 transition-all"
        >
          <span className="text-sm">📲</span>
          <span>Install</span>
        </button>
      )}

      {showIosModal && <IosInstallModal onClose={() => setShowIosModal(false)} />}
    </>
  );
}

export function PwaInstallCard() {
  const { isInstallable, isInstalled, isIos, triggerInstall } = usePwaInstall();
  const [showIosModal, setShowIosModal] = useState(false);

  return (
    <div className="pwa-card bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">App Installation</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {isInstalled
              ? "MedFlow is installed and running in standalone mode."
              : "Install MedFlow on your device for fast access and offline capability."}
          </p>
        </div>
        {isInstalled && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            ✓ Installed
          </span>
        )}
      </div>

      {!isInstalled && (
        <div className="mt-3">
          {isInstallable ? (
            <button
              onClick={() => triggerInstall()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 active:scale-[0.99] transition-all"
            >
              <span>⬇️</span>
              <span>Install MedFlow App Now</span>
            </button>
          ) : isIos ? (
            <button
              onClick={() => setShowIosModal(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 active:scale-[0.99] transition-all"
            >
              <span>📲</span>
              <span>How to Install on iPhone / iPad</span>
            </button>
          ) : (
            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200">
              <p className="font-medium text-slate-800">To install on your browser:</p>
              <ul className="mt-1 list-disc list-inside space-y-0.5 text-slate-500">
                <li><strong>Chrome/Edge (Desktop):</strong> Click the install icon (🖥️/⬇️) in the right side of the address bar.</li>
                <li><strong>Chrome (Android):</strong> Tap the 3 dots menu (⋮) and tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {showIosModal && <IosInstallModal onClose={() => setShowIosModal(false)} />}
    </div>
  );
}

function IosInstallModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Install MedFlow on iOS</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <p className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">1</span>
            <span>Tap the <strong className="text-slate-900">Share</strong> button in Safari (square with arrow).</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">2</span>
            <span>Scroll down and select <strong className="text-slate-900">Add to Home Screen</strong>.</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">3</span>
            <span>Tap <strong className="text-slate-900">Add</strong> in top right.</span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
