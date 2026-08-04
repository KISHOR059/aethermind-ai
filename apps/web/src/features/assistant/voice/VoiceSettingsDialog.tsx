import { useState } from "react";
import { Sliders, Volume2, Mic, RotateCcw, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import {
  DEFAULT_VOICE_SETTINGS,
  VOICE_SETTINGS_STORAGE_KEY,
  type VoiceSettings,
} from "./voice.types";
import { notify } from "@/shared/lib/notifications";

export interface VoiceSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voices: SpeechSynthesisVoice[];
  settings: VoiceSettings;
  onSaveSettings: (settings: VoiceSettings) => void;
}

const SUPPORTED_LANGUAGES = [
  { code: "en-US", name: "English (US)" },
  { code: "en-GB", name: "English (UK)" },
  { code: "es-ES", name: "Spanish (Spain)" },
  { code: "fr-FR", name: "French (France)" },
  { code: "de-DE", name: "German (Germany)" },
  { code: "hi-IN", name: "Hindi (India)" },
  { code: "ja-JP", name: "Japanese (Japan)" },
  { code: "zh-CN", name: "Chinese (Mandarin)" },
];

export function VoiceSettingsDialog({
  open,
  onOpenChange,
  voices,
  settings,
  onSaveSettings,
}: VoiceSettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState<VoiceSettings>(settings);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setLocalSettings(settings);
    }
    onOpenChange(newOpen);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(
        VOICE_SETTINGS_STORAGE_KEY,
        JSON.stringify(localSettings),
      );
      onSaveSettings(localSettings);
      notify.success("Voice settings saved");
      onOpenChange(false);
    } catch {
      notify.error("Failed to save voice settings");
    }
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_VOICE_SETTINGS);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sliders className="size-4 text-primary" />
            Voice Assistant Settings
          </DialogTitle>
          <DialogDescription className="text-xs">
            Configure speech recognition language, text-to-speech voice, rate, and automatic features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Language Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Language</label>
            <select
              value={localSettings.language}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, language: e.target.value })
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.code})
                </option>
              ))}
            </select>
          </div>

          {/* Voice Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold flex items-center justify-between">
              <span>Text-to-Speech Voice</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                {voices.length} voices available
              </span>
            </label>
            <select
              value={localSettings.voiceURI}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, voiceURI: e.target.value })
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Default System Voice</option>
              {voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Speech Rate Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold">Speech Rate</label>
              <span className="text-muted-foreground font-mono text-[11px]">
                {localSettings.rate.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={localSettings.rate}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  rate: parseFloat(e.target.value),
                })
              }
              className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Speech Pitch Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold">Speech Pitch</label>
              <span className="text-muted-foreground font-mono text-[11px]">
                {localSettings.pitch.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={localSettings.pitch}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  pitch: parseFloat(e.target.value),
                })
              }
              className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  <Volume2 className="size-3.5 text-primary" />
                  Auto-Speak AI Responses
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Read out assistant replies automatically when generated.
                </p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.autoSpeak}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    autoSpeak: e.target.checked,
                  })
                }
                className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  <Mic className="size-3.5 text-primary" />
                  Auto-Listen After Response
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Automatically start listening after AI finishes speaking.
                </p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.autoListen}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    autoListen: e.target.checked,
                  })
                }
                className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-muted-foreground gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            Reset Defaults
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} className="text-xs gap-1.5">
              <Check className="size-3.5" />
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default VoiceSettingsDialog;
