import { useQuery } from "@tanstack/react-query";

export const extractGitHubOwnerAndRepo = (repoUrl: string): [string, string] => {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git|\/|$)/);
  if (!match) throw new Error("Invalid GitHub repository URL format");
  return [match[1], match[2]];
};


async function getAllBranches(
  repoUrl: string,
  token?: string
): Promise<string[]> {
  const { owner, repo } = parseGitHubUrl(repoUrl);
  const perPage = 100;
  let page = 1;
  let allBranches: string[] = [];

  while (true) {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/branches?per_page=${perPage}&page=${page}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );

     if (response.status === 401) {
      throw new Error("Invalid or unauthorized GitHub token. Please check and try again.");
    }

    if (response.status === 404) {
      throw new Error("Repository not found. Check URL or token.");
    }

    if (!response.ok) {
      throw new Error(`Error fetching branches: ${response.status} ${response.statusText}`);
    }


    const branches = await response.json();

    if (branches.length === 0) break;

    const branchNames = branches.map((branch: any) => branch.name);
    allBranches = allBranches.concat(branchNames);

    if (branches.length < perPage) break;
    page++;
  }

  return allBranches;
}

export function parseGitHubUrl(url: string): { owner: string; repo: string } {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git|\/|$)/);
  if (!match) throw new Error("Invalid GitHub URL format");
  return { owner: match[1], repo: match[2] };
}

export function useGetGitBranchesService(
  repoUrl: string,
  token?: string,
  enabled?: boolean
) {
  return useQuery<string[]>({
    queryKey: ["gitBranches", repoUrl, token],
    queryFn: () => getAllBranches(repoUrl, token),
    enabled: !!enabled && !!repoUrl, // Run only if enabled and repoUrl is provided
    placeholderData: (prev) => prev,
  });
}

async function checkRepoVisibility(repoUrl: string): Promise<boolean> {
  const [owner, repo] = extractGitHubOwnerAndRepo(repoUrl);
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);

  if (response.ok) return false; // Public repository
  if (response.status === 404) return true; // Likely private
  throw new Error("Error checking repository visibility.");
}

export function useCheckRepoVisibilityService(
  repoUrl: string,
  enabled?: boolean
) {
  return useQuery<boolean>({
    queryKey: ["repoVisibility", repoUrl],
    queryFn: () => checkRepoVisibility(repoUrl),
    enabled: !!enabled && !!repoUrl,
    placeholderData: (prev) => prev,
  });
}