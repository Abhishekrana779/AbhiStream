import { useState } from "react";
import {
  FiSettings,
  FiMonitor,
  FiVolume2,
  FiBell,
  FiShield,
  FiRadio,
  FiSliders,
} from "react-icons/fi";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface AppSettings {
  autoplay: boolean;
  defaultQuality: "auto" | "1080p" | "720p" | "480p" | "360p";
  defaultSpeed: number;
  subtitles: boolean;
  subtitleSize: "small" | "medium" | "large";
  notifications: boolean;
  emailNotifications: boolean;
  theme: "dark" | "light" | "auto";
  completedMarkColor: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  autoplay: true,
  defaultQuality: "auto",
  defaultSpeed: 1,
  subtitles: true,
  subtitleSize: "medium",
  notifications: true,
  emailNotifications: false,
  theme: "dark",
  completedMarkColor: "#3b82f6",
};

export default function Settings() {
  const [settings, setSettings] = useLocalStorage<AppSettings>(
    "abhistream_settings",
    DEFAULT_SETTINGS,
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "playback" | "display" | "notifications"
  >("playback");
  const [saved, setSaved] = useState(false);

  const handleSettingChange = (
    key: keyof AppSettings,
    value: AppSettings[keyof AppSettings],
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    setHasChanges(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const SettingRow = ({
    label,
    description,
    icon,
    children,
  }: {
    label: string;
    description?: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between py-4 border-b border-dark-700 last:border-b-0">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0 mt-1">
          {icon}
        </div>
        <div>
          <p className="text-white font-medium">{label}</p>
          {description && (
            <p className="text-gray-400 text-sm mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );

  const Toggle = ({
    value,
    onChange,
  }: {
    value: boolean;
    onChange: (value: boolean) => void;
  }) => (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        value ? "bg-primary" : "bg-dark-600"
      }`}
    >
      <div
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
          value ? "translate-x-6" : ""
        }`}
      />
    </button>
  );

  return (
    <div className="min-h-screen bg-dark-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <FiSettings className="w-8 h-8 text-primary" />
            Settings
          </h1>
          <p className="text-gray-400 mt-2">
            Customize your viewing experience
          </p>
        </div>

        {/* Success Message */}
        {saved && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg">
            ✓ Settings saved successfully
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden sticky top-24">
              <button
                onClick={() => setActiveTab("playback")}
                className={`w-full px-4 py-3 text-left font-medium transition flex items-center gap-3 ${
                  activeTab === "playback"
                    ? "bg-primary text-white"
                    : "text-gray-400 hover:text-white hover:bg-dark-700"
                }`}
              >
                <FiVolume2 className="w-5 h-5" />
                Playback
              </button>
              <button
                onClick={() => setActiveTab("display")}
                className={`w-full px-4 py-3 text-left font-medium transition flex items-center gap-3 border-t border-dark-700 ${
                  activeTab === "display"
                    ? "bg-primary text-white"
                    : "text-gray-400 hover:text-white hover:bg-dark-700"
                }`}
              >
                <FiMonitor className="w-5 h-5" />
                Display
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`w-full px-4 py-3 text-left font-medium transition flex items-center gap-3 border-t border-dark-700 ${
                  activeTab === "notifications"
                    ? "bg-primary text-white"
                    : "text-gray-400 hover:text-white hover:bg-dark-700"
                }`}
              >
                <FiBell className="w-5 h-5" />
                Notifications
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
              {/* Playback Settings */}
              {activeTab === "playback" && (
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Playback Settings
                  </h2>

                  <SettingRow
                    label="Autoplay"
                    description="Automatically play the next episode"
                    icon={<FiRadio className="w-5 h-5" />}
                  >
                    <Toggle
                      value={settings.autoplay}
                      onChange={(value) =>
                        handleSettingChange("autoplay", value)
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    label="Default Quality"
                    description="Quality to use when available"
                    icon={<FiMonitor className="w-5 h-5" />}
                  >
                    <select
                      value={settings.defaultQuality}
                      onChange={(e) =>
                        handleSettingChange(
                          "defaultQuality",
                          e.target.value as AppSettings["defaultQuality"],
                        )
                      }
                      className="bg-dark-700 border border-dark-600 text-white rounded px-3 py-1 text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="auto">Auto</option>
                      <option value="1080p">1080p</option>
                      <option value="720p">720p</option>
                      <option value="480p">480p</option>
                      <option value="360p">360p</option>
                    </select>
                  </SettingRow>

                  <SettingRow
                    label="Playback Speed"
                    description="Default playback speed"
                    icon={<FiSliders className="w-5 h-5" />}
                  >
                    <div className="flex items-center gap-2">
                      <select
                        value={settings.defaultSpeed}
                        onChange={(e) =>
                          handleSettingChange(
                            "defaultSpeed",
                            parseFloat(e.target.value),
                          )
                        }
                        className="bg-dark-700 border border-dark-600 text-white rounded px-3 py-1 text-sm focus:outline-none focus:border-primary"
                      >
                        <option value={0.5}>0.5x</option>
                        <option value={0.75}>0.75x</option>
                        <option value={1}>1x</option>
                        <option value={1.25}>1.25x</option>
                        <option value={1.5}>1.5x</option>
                        <option value={2}>2x</option>
                      </select>
                      <span className="text-gray-400 text-sm">
                        {settings.defaultSpeed}x
                      </span>
                    </div>
                  </SettingRow>

                  <SettingRow
                    label="Subtitles"
                    description="Show subtitles by default"
                    icon={<FiRadio className="w-5 h-5" />}
                  >
                    <Toggle
                      value={settings.subtitles}
                      onChange={(value) =>
                        handleSettingChange("subtitles", value)
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    label="Subtitle Size"
                    description="Default subtitle text size"
                    icon={<FiMonitor className="w-5 h-5" />}
                  >
                    <select
                      value={settings.subtitleSize}
                      onChange={(e) =>
                        handleSettingChange(
                          "subtitleSize",
                          e.target.value as AppSettings["subtitleSize"],
                        )
                      }
                      className="bg-dark-700 border border-dark-600 text-white rounded px-3 py-1 text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </SettingRow>
                </div>
              )}

              {/* Display Settings */}
              {activeTab === "display" && (
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Display Settings
                  </h2>

                  <SettingRow
                    label="Theme"
                    description="Choose your preferred color scheme"
                    icon={<FiMonitor className="w-5 h-5" />}
                  >
                    <select
                      value={settings.theme}
                      onChange={(e) =>
                        handleSettingChange(
                          "theme",
                          e.target.value as AppSettings["theme"],
                        )
                      }
                      className="bg-dark-700 border border-dark-600 text-white rounded px-3 py-1 text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                      <option value="auto">Auto (System)</option>
                    </select>
                  </SettingRow>

                  <SettingRow
                    label="Completed Mark Color"
                    description="Color used to mark watched anime"
                    icon={<FiRadio className="w-5 h-5" />}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.completedMarkColor}
                        onChange={(e) =>
                          handleSettingChange(
                            "completedMarkColor",
                            e.target.value,
                          )
                        }
                        className="w-10 h-10 rounded cursor-pointer border border-dark-600"
                      />
                      <span className="text-gray-400 text-sm">
                        {settings.completedMarkColor}
                      </span>
                    </div>
                  </SettingRow>

                  <div className="p-4 bg-dark-700 rounded-lg mt-6">
                    <p className="text-gray-300 text-sm">
                      <strong>Display Tip:</strong> You can customize how your
                      anime list appears across the platform using these display
                      settings.
                    </p>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeTab === "notifications" && (
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Notification Settings
                  </h2>

                  <SettingRow
                    label="Push Notifications"
                    description="Receive browser notifications for updates"
                    icon={<FiBell className="w-5 h-5" />}
                  >
                    <Toggle
                      value={settings.notifications}
                      onChange={(value) =>
                        handleSettingChange("notifications", value)
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    label="Email Notifications"
                    description="Receive email updates about your favorite anime"
                    icon={<FiShield className="w-5 h-5" />}
                  >
                    <Toggle
                      value={settings.emailNotifications}
                      onChange={(value) =>
                        handleSettingChange("emailNotifications", value)
                      }
                    />
                  </SettingRow>

                  <div className="p-4 bg-dark-700 rounded-lg mt-6">
                    <p className="text-gray-300 text-sm">
                      <strong>Privacy Note:</strong> We respect your privacy.
                      You can manage all notification preferences here. Learn
                      more in our{" "}
                      <a href="#" className="text-primary hover:underline">
                        privacy policy
                      </a>
                      .
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-dark-700">
                <button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className={`flex-1 py-2 font-semibold rounded-lg transition flex items-center justify-center gap-2 ${
                    hasChanges
                      ? "btn-primary"
                      : "bg-dark-700 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <FiShield className="w-5 h-5" />
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setSettings(DEFAULT_SETTINGS);
                    setHasChanges(false);
                  }}
                  className="flex-1 px-4 py-2 bg-dark-700 text-gray-300 hover:text-white border border-dark-600 rounded-lg font-semibold transition"
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
