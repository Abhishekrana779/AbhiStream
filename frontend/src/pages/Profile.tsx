import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiLock,
  FiEdit2,
  FiSave,
  FiX,
  FiLogOut,
  FiTrash2,
  FiCalendar,
  FiUpload,
} from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { authApi } from "../services/authApi";
import ImageWithFallback from "../components/ImageWithFallback";
import ErrorMessage from "../components/ErrorMessage";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"profile" | "password" | "danger">(
    "profile",
  );
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profileData, setProfileData] = useState({
    username: user?.username || "",
    avatar: user?.avatar || "",
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    setProfileData({
      username: user?.username || "",
      avatar: user?.avatar || "",
    });
  }, [user]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <ErrorMessage message="Please log in to view your profile" />
      </div>
    );
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAvatarFile(file);
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    if (file) {
      setProfileData((prev) => ({ ...prev, avatar: "" }));
    }
  };

  const handleProfileSave = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      let avatarUrl = profileData.avatar;

      if (avatarFile) {
        const uploaded = await authApi.uploadAvatar(avatarFile);
        avatarUrl = uploaded.avatar || avatarUrl;
      }

      await authApi.updateProfile({
        username: profileData.username,
        avatar: avatarUrl,
      });
      await refreshUser();
      setSuccess("Profile updated successfully");
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!passwordData.currentPassword) {
      setError("Current password is required");
      return;
    }
    if (!passwordData.newPassword) {
      setError("New password is required");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setSuccess("Password changed successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to change password",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone.",
      )
    ) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await authApi.deleteAccount();
      logout();
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to logout?")) {
      return;
    }
    logout();
    navigate("/login");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-dark-900 pt-4 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white break-words">Account Settings</h1>
          <p className="text-gray-400 mt-2">
            Manage your profile and preferences
          </p>
        </div>

        <div className="mb-6 p-4 bg-dark-800 border border-dark-700 rounded-xl">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:gap-4 sm:text-left">
            <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 bg-dark-700">
              <ImageWithFallback
                src={user.avatar}
                alt={user.username}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-white break-words">
                {user.username}
              </h2>
              <p className="text-gray-400 text-sm flex items-center justify-center gap-2 mt-1 break-all sm:justify-start">
                <FiMail className="w-4 h-4 shrink-0" />
                {user.email}
              </p>
              <p className="text-gray-500 text-sm flex items-center justify-center gap-2 mt-2 sm:justify-start">
                <FiCalendar className="w-4 h-4 shrink-0" />
                Member since {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full px-4 py-3 text-left font-medium transition flex items-center gap-3 min-w-0 ${
                  activeTab === "profile"
                    ? "bg-primary text-white"
                    : "text-gray-400 hover:text-white hover:bg-dark-700"
                }`}
              >
                <FiUser className="w-5 h-5 shrink-0" />
                <span className="truncate">Profile</span>
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`w-full px-4 py-3 text-left font-medium transition flex items-center gap-3 border-t border-dark-700 min-w-0 ${
                  activeTab === "password"
                    ? "bg-primary text-white"
                    : "text-gray-400 hover:text-white hover:bg-dark-700"
                }`}
              >
                <FiLock className="w-5 h-5 shrink-0" />
                <span className="truncate">Security</span>
              </button>
              <button
                onClick={() => setActiveTab("danger")}
                className={`w-full px-4 py-3 text-left font-medium transition flex items-center gap-3 border-t border-dark-700 min-w-0 ${
                  activeTab === "danger"
                    ? "bg-red-500/20 text-red-400"
                    : "text-gray-400 hover:text-red-400 hover:bg-red-500/5"
                }`}
              >
                <FiTrash2 className="w-5 h-5 shrink-0" />
                <span className="truncate">Delete</span>
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="w-full mt-4 px-4 py-3 bg-dark-800 border border-dark-700 text-gray-300 hover:text-white hover:border-primary rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              <FiLogOut className="w-5 h-5" />
              Logout
            </button>
          </div>

          <div className="lg:col-span-3">
            {error && <ErrorMessage message={error} />}
            {success && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg">
                {success}
              </div>
            )}

            {activeTab === "profile" && (
              <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 space-y-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={profileData.username}
                        onChange={handleProfileChange}
                        className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Profile Picture
                      </label>

                      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden border border-dark-600 bg-dark-700 shrink-0">
                          {avatarPreview ? (
                            <img
                              src={avatarPreview}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageWithFallback
                              src={profileData.avatar || user.avatar}
                              alt={user.username}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:border-primary transition">
                            <FiUpload className="w-4 h-4" />
                            Choose Image
                            <input
                              ref={avatarInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              onChange={handleAvatarChange}
                              className="hidden"
                            />
                          </label>

                          {(profileData.avatar || avatarPreview) && (
                            <button
                              type="button"
                              onClick={() => {
                                setAvatarFile(null);
                                setAvatarPreview((prev) => {
                                  if (prev) URL.revokeObjectURL(prev);
                                  return null;
                                });
                                setProfileData((prev) => ({ ...prev, avatar: "" }));
                                if (avatarInputRef.current) {
                                  avatarInputRef.current.value = "";
                                }
                              }}
                              className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition"
                              title="Remove avatar"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {avatarFile && (
                        <p className="mt-2 text-xs text-gray-400">
                          {avatarFile.name} ({(avatarFile.size / 1024).toFixed(1)} KB)
                        </p>
                      )}

                      <p className="mt-2 text-xs text-gray-500">
                        Max size: 2MB. Supported: JPEG, PNG, WEBP, GIF
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleProfileSave}
                        disabled={loading}
                        className="flex-1 btn-primary py-2 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FiSave className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setProfileData({
                            username: user.username,
                            avatar: user.avatar,
                          });
                          setAvatarFile(null);
                          setAvatarPreview((prev) => {
                            if (prev) URL.revokeObjectURL(prev);
                            return null;
                          });
                          if (avatarInputRef.current) {
                            avatarInputRef.current.value = "";
                          }
                        }}
                        className="px-6 py-2 bg-dark-700 text-gray-300 hover:text-white border border-dark-600 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                      >
                        <FiX className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full py-3 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <FiEdit2 className="w-5 h-5" />
                    Edit Profile
                  </button>
                )}
              </div>
            )}

            {activeTab === "password" && (
              <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">
                  Change Password
                </h2>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary py-2 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FiLock className="w-5 h-5" />
                        Change Password
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {activeTab === "danger" && (
              <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">
                  Danger Zone
                </h2>

                <div className="p-4 bg-red-500/5 border border-red-500/30 rounded-lg">
                  <h3 className="text-red-400 font-semibold mb-2">
                    Delete Account
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Once you delete your account, there is no going back. Please
                    be certain.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50 rounded-lg font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <FiTrash2 className="w-5 h-5" />
                        Delete Account
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
