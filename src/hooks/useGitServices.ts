import { checkRepoVisibility, getAllBranches } from "@/services/git";
import { useQuery } from "@tanstack/react-query";

export function useGetGitBranchesService(
    repoUrl: string,
    token?: string,
    enabled?: boolean
) {
    return useQuery<string[]>({
        queryKey: ["gitBranches", repoUrl, token],
        queryFn: () => getAllBranches(repoUrl, token),
        enabled: !!enabled && !!repoUrl, // Run only if enabled and repoUrl is provided
        placeholderData: (prev) => prev
    });
}

export function useCheckRepoVisibilityService(
    repoUrl: string,
    enabled?: boolean
) {
    return useQuery<boolean>({
        queryKey: ["repoVisibility", repoUrl],
        queryFn: () => checkRepoVisibility(repoUrl),
        enabled: !!enabled && !!repoUrl,
        placeholderData: (prev) => prev
    });
}
