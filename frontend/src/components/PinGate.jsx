import React, { useState } from "react";
import { Lock } from "lucide-react";
import { T, fontDisplay, fontBody, fontMono } from "../lib/gameData";
import { loadDmPin, saveDmPin } from "../lib/api";

export default function PinGate({ hasPin, onSuccess, onBack }) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setError("");
    if (!hasPin) {
      if (pin.length < 4) { setError("PIN must be at least 4 characters."); return; }
      if (pin !== confirm) { setError("PINs don't match."); return; }
      setBusy(true);
      await saveDmPin(pin);
      setBusy(false);
      onSuccess();
    } else {
      setBusy(true);
      const stored = await loadDmPin();
      setBusy(false);
      if (pin === stored) onSuccess();
      else setError("Incorrect PIN.");
    }
  }
  async function handleReset() {
    await saveDmPin(null);
    setError(""); setPin(""); setConfirm("");
    onBack();
  }

  return (
    <div className="flex flex-col items-center pt-16 px-4">
      <Lock size={28} color={T.gold} />
      <h2 className="mt-3" style={{ ...fontDisplay, color: T.parchment, fontSize: "24px", fontWeight: 700 }}>
        {hasPin ? "Enter DM PIN" : "Set a DM PIN"}
      </h2>
      <p className="text-xs mt-1 text-center max-w-xs" style={{ ...fontBody, color: T.parchmentDim }}>
        {hasPin ? "Keeps the players' hands off the monster stats." : "This just keeps curious players out — not real security. Shared by everyone using this link."}
      </p>
      <div className="flex flex-col gap-2 mt-5 w-full max-w-[220px]">
        <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN"
          className="rounded px-3 py-2 text-center outline-none" style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}`, ...fontMono }} />
        {!hasPin && (
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm PIN"
            className="rounded px-3 py-2 text-center outline-none" style={{ background: T.void, color: T.parchment, border: `1px solid ${T.line}`, ...fontMono }} />
        )}
        {error && <span className="text-xs" style={{ color: T.blood, ...fontBody }}>{error}</span>}
        <button onClick={handleSubmit} disabled={busy} className="rounded px-3 py-2 mt-1" style={{ background: T.mossDim, border: `1px solid ${T.moss}`, color: T.parchment, ...fontBody }}>
          {busy ? "…" : hasPin ? "Enter" : "Set PIN"}
        </button>
        <button onClick={onBack} className="text-xs mt-1" style={{ color: T.parchmentDim, ...fontBody }}>← Back</button>
        {hasPin && <button onClick={handleReset} className="text-xs" style={{ color: T.blood, ...fontBody }}>Forgot PIN? Reset it</button>}
      </div>
    </div>
  );
}
