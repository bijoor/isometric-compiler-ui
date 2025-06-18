import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  useCheckRepoVisibilityService,
  useGetGitBranchesService,
} from "../services/use-git-service";
import { Loader, CheckCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface GitRepoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string, token: string, branch: string) => void;
}

const GitRepoDialog: React.FC<GitRepoDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const queryClient = useQueryClient();

  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [branches, setBranches] = useState<string[]>([]);
  const [urlValidated, setUrlValidated] = useState(false);

  const {
    isLoading: checkingRepo,
    isError: repoError,
    error: repoErrorObj,
    refetch: refetchRepoVisibility,
  } = useCheckRepoVisibilityService(url, false);

  const {
    isLoading: loadingBranches,
    isError: branchesError,
    error: branchesErrorObj,
    refetch: refetchBranches,
  } = useGetGitBranchesService(
    url,
    requiresAuth ? token : undefined,
    false
  );

  useEffect(() => {
    if (isOpen) {
      resetAll();
    }
  }, [isOpen]);

  const resetAll = () => {
    setUrl("");
    setToken("");
    setRequiresAuth(false);
    setSelectedBranch("");
    setBranches([]);
    setUrlValidated(false);
    queryClient.removeQueries();
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const handleCheckVisibility = async () => {
  if (!url.trim()) return;

  try {
    const result = await refetchRepoVisibility();
    if (result.data !== undefined) {
      setRequiresAuth(result.data);
      setUrlValidated(true);

        // Auto-fetch branches if public
      if (result.data === false) {
        const branchResult = await refetchBranches();
        if (branchResult?.data) setBranches(branchResult.data);
      }
    }
  } catch (error) {
    console.error(error);
  }
};

  const handleFetchBranchesWithToken = async () => {
    if (!token.trim()) return;

    try {
      const branchResult = await refetchBranches();
      if (branchResult?.data) setBranches(branchResult.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleGenerateWiki = () => {
    if (!selectedBranch) return;
    onSubmit(url, token, selectedBranch);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="bg-customGray text-white"
        aria-describedby="dialog-description"
      >
        <DialogHeader>
          <DialogTitle>Attach Git Repository</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* URL input and check button in same row */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Git Repository URL <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative w-full">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://github.com/org/repo"
                  className="w-full bg-customLightGray text-white border-gray-600"
                  disabled={urlValidated}
                />
                {checkingRepo && (
                  <div className="absolute inset-y-0 right-2 flex items-center">
                    <Loader className="w-4 h-4 animate-spin text-gray-300" />
                  </div>
                )}
                {!checkingRepo && urlValidated && !repoError && (
                  <div className="absolute inset-y-0 right-2 flex items-center text-green-400">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                )}
              </div>

              {!urlValidated && (
                <Button
                  onClick={handleCheckVisibility}
                  className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                  disabled={!url || checkingRepo}
                >
                  {checkingRepo ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    "Check"
                  )}
                </Button>
              )}
            </div>

            {repoError && (
              <div className="text-red-400 text-sm mt-1">
                {repoErrorObj?.message || "Failed to check repository visibility."}
              </div>
            )}
          </div>

          {/* Token input */}
          {requiresAuth && urlValidated && (
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
                Git Repository Token <span className="text-red-400">*</span>
              </label>
              <Input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter GitHub token with 'repo' access"
                className="w-full !bg-customLightGray text-white border-gray-600"
                disabled={loadingBranches}
              />
              <p className="text-gray-400 text-xs mt-1">
                Generate token at{" "}
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-400"
                >
                  GitHub tokens
                </a>
              </p>

              <Button
                onClick={handleFetchBranchesWithToken}
                className="mt-2 bg-blue-600 hover:bg-blue-700"
                disabled={!token || loadingBranches}
              >
                {loadingBranches ? (
                  <div className="flex items-center">
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Fetching branches...
                  </div>
                ) : (
                  "Fetch Branches"
                )}
              </Button>

              {branchesError && (
                <div className="text-red-400 text-sm mt-2">
                  {(() => {
                    const errorObj = branchesErrorObj as any;
                    if (errorObj?.status === "404" || errorObj?.message === "Not Found") {
                      return "Repository URL or Token is incorrect. Please verify and try again.";
                    }
                    return errorObj?.message || "Failed to fetch branches.";
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Branch dropdown */}
          {branches.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
                Select Branch <span className="text-red-400">*</span>
              </label>
              <select
                className="w-full bg-customLightGray text-white border-gray-600 p-2 rounded"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="">Select a branch</option>
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              onClick={handleClose}
              className="bg-gray-600 hover:bg-gray-700"
              disabled={checkingRepo || loadingBranches}
            >
              Cancel
            </Button>
            {branches.length > 0 && (
              <Button
                onClick={handleGenerateWiki}
                className="bg-green-600 hover:bg-green-700"
                disabled={!selectedBranch}
              >
                Proceed
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GitRepoDialog;
