"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Eye, EyeOff } from "lucide-react";
import { auth } from "@/lib/firebase";
import { accountApi } from "@/lib/api-client";
import { fetchSignInMethodsForEmail, EmailAuthProvider, reauthenticateWithCredential, updatePassword, signOut } from "firebase/auth";

export default function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmNewPassword, setConfirmNewPassword] = React.useState("");
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = React.useState(false);
  const [passwordLoading, setPasswordLoading] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState("");
  const [passwordSuccess, setPasswordSuccess] = React.useState("");

  const [deleteConfirmation, setDeleteConfirmation] = React.useState("");
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState("");

  async function handleChangePassword() {
    setPasswordError("");
    setPasswordSuccess("");
    const user = auth.currentUser;
    if (!user || !user.email) {
      setPasswordError("You must be signed in to change password.");
      return;
    }
    if (!currentPassword.trim()) { setPasswordError("Current password is required."); return; }
    if (newPassword.length < 6) { setPasswordError("New password must be at least 6 characters."); return; }
    if (newPassword !== confirmNewPassword) { setPasswordError("New password and confirmation do not match."); return; }

    setPasswordLoading(true);
    try {
      const methods = await fetchSignInMethodsForEmail(auth, user.email);
      if (!methods.includes("password")) {
        setPasswordError("This account uses external sign-in; password changes not available.");
        return;
      }
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword("");
      setPasswordSuccess("Password changed successfully.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        setPasswordError("Current password is incorrect.");
      } else if (msg.includes("requires-recent-login")) {
        setPasswordError("Please sign in again and retry.");
      } else {
        setPasswordError("Failed to change password. Please try again.");
      }
    } finally { setPasswordLoading(false); }
  }

  async function handleDeleteAccount() {
    setDeleteError("");
    if (deleteConfirmation.trim().toUpperCase() !== "DELETE") { setDeleteError("Type DELETE to confirm account deletion."); return; }
    setDeleteLoading(true);
    try {
      await accountApi.remove();
      await signOut(auth);
      // client will redirect after sign-out elsewhere
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete account. Please try again.";
      setDeleteError(msg);
    } finally { setDeleteLoading(false); }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-foreground">
          <ShieldAlert className="h-4 w-4" />
          <h3 className="text-lg font-medium">Security</h3>
        </div>
        <p className="text-sm text-muted-foreground">Manage password and account deletion.</p>

        <div className="grid gap-4 lg:grid-cols-3 min-w-0">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input id="currentPassword" type={showCurrentPassword?"text":"password"} value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} className="pr-10" />
              <button type="button" onClick={()=>setShowCurrentPassword(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="toggle">
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input id="newPassword" type={showNewPassword?"text":"password"} value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} className="pr-10" />
              <button type="button" onClick={()=>setShowNewPassword(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="toggle">
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
            <div className="relative">
              <Input id="confirmNewPassword" type={showConfirmNewPassword?"text":"password"} value={confirmNewPassword} onChange={(e)=>setConfirmNewPassword(e.target.value)} className="pr-10" />
              <button type="button" onClick={()=>setShowConfirmNewPassword(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="toggle">
                {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <Button onClick={handleChangePassword} disabled={passwordLoading}>{passwordLoading?"Updating...":"Change Password"}</Button>
        {passwordError && <p className="text-xs text-red-600">{passwordError}</p>}
        {passwordSuccess && <p className="text-xs text-green-600">{passwordSuccess}</p>}
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-red-700">
          <ShieldAlert className="h-4 w-4" />
          <h4 className="text-sm font-semibold">Delete Account</h4>
        </div>
        <p className="text-xs text-red-700/90">This action is permanent. Your profile, tasks, and sessions will be removed.</p>

        <div className="space-y-2 max-w-xs">
          <Label htmlFor="deleteConfirmation">Type DELETE to confirm</Label>
          <Input id="deleteConfirmation" value={deleteConfirmation} onChange={(e)=>setDeleteConfirmation(e.target.value)} placeholder="DELETE" />
        </div>

        <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteLoading}>{deleteLoading?"Deleting...":"Delete Account"}</Button>
        {deleteError && <p className="text-xs text-red-700">{deleteError}</p>}
      </div>
    </div>
  );
}
